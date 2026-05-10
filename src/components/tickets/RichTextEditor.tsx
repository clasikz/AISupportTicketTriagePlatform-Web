"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    KeyboardEvent,
    ClipboardEvent,
    MouseEvent as ReactMouseEvent,
} from "react";
import { uploadImage } from "@/lib/uploadImage";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";

interface Props {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
    disabled?: boolean;
    className?: string;
}

const ALLOWED_IMAGE_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_WIDTH = 80;

// Tiny inline SVG spinner used as the upload placeholder. data: URI gets stripped by the
// sanitizer on submit, so if the user submits before upload completes the placeholder
// vanishes cleanly rather than persisting as broken HTML.
const SPINNER_DATA_URI =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#dfe1e6" stroke-width="4"/><path d="M24 4a20 20 0 0 1 20 20" fill="none" stroke="#0052cc" stroke-width="4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="0.8s" repeatCount="indefinite"/></path></svg>`
    );

export default function RichTextEditor({
    value,
    onChange,
    placeholder = "",
    minHeight = 120,
    disabled = false,
    className = "",
}: Props) {
    const editorRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement | null>(null);
    const selectedImgRef = useRef<HTMLImageElement | null>(null);
    const [error, setError] = useState<string>("");
    const [isFocused, setIsFocused] = useState(false);

    // ── Initial mount: seed innerHTML once ────────────────────────────────────
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML === "") {
            editorRef.current.innerHTML = value;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Sync DOM when parent resets value (e.g. after submit) ─────────────────
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        // Only push the parent value into the DOM when:
        //  1. it differs from current innerHTML, AND
        //  2. the user isn't actively editing (focused).
        // Otherwise we'd clobber their cursor on every keystroke.
        if (!isFocused && el.innerHTML !== value) {
            el.innerHTML = value || "";
        }
    }, [value, isFocused]);

    // ── Image selection / resize handle ───────────────────────────────────────
    const removeHandle = useCallback(() => {
        if (handleRef.current) {
            handleRef.current.remove();
            handleRef.current = null;
        }
        if (selectedImgRef.current) {
            selectedImgRef.current.classList.remove("rte-img-selected");
            selectedImgRef.current = null;
        }
    }, []);

    const positionHandle = useCallback(() => {
        const handle = handleRef.current;
        const img = selectedImgRef.current;
        const wrapper = wrapperRef.current;
        if (!handle || !img || !wrapper) return;

        const imgRect = img.getBoundingClientRect();
        const wrapRect = wrapper.getBoundingClientRect();
        // Position the handle at the bottom-right corner of the image, relative to wrapper.
        handle.style.left = `${imgRect.right - wrapRect.left + wrapper.scrollLeft - 7}px`;
        handle.style.top = `${imgRect.bottom - wrapRect.top + wrapper.scrollTop - 7}px`;
    }, []);

    const selectImage = useCallback(
        (img: HTMLImageElement) => {
            removeHandle();

            selectedImgRef.current = img;
            img.classList.add("rte-img-selected");

            const handle = document.createElement("div");
            handle.className = "rte-resize-handle";
            handle.style.position = "absolute";
            handle.style.width = "14px";
            handle.style.height = "14px";
            handle.style.background = "#0052cc";
            handle.style.border = "2px solid white";
            handle.style.borderRadius = "2px";
            handle.style.cursor = "nwse-resize";
            handle.style.zIndex = "10";
            handle.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";

            handle.addEventListener("mousedown", (e: globalThis.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (!selectedImgRef.current) return;
                const startX = e.clientX;
                const startWidth = selectedImgRef.current.offsetWidth;
                const wrapperWidth = wrapperRef.current?.clientWidth ?? 600;
                const maxWidth = Math.max(MIN_IMAGE_WIDTH, wrapperWidth - 24);

                const onMove = (ev: globalThis.MouseEvent) => {
                    if (!selectedImgRef.current) return;
                    const dx = ev.clientX - startX;
                    const next = Math.round(
                        Math.min(maxWidth, Math.max(MIN_IMAGE_WIDTH, startWidth + dx))
                    );
                    selectedImgRef.current.setAttribute("width", String(next));
                    // Height stays unset — browser auto-derives from natural aspect ratio.
                    selectedImgRef.current.removeAttribute("height");
                    positionHandle();
                };
                const onUp = () => {
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                    if (editorRef.current) onChange(editorRef.current.innerHTML);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
            });

            wrapperRef.current?.appendChild(handle);
            handleRef.current = handle;
            positionHandle();
        },
        [removeHandle, positionHandle, onChange]
    );

    // Reposition handle on scroll/resize so it tracks the image visually.
    useEffect(() => {
        const wrap = wrapperRef.current;
        if (!wrap) return;
        const reposition = () => positionHandle();
        wrap.addEventListener("scroll", reposition);
        window.addEventListener("resize", reposition);
        return () => {
            wrap.removeEventListener("scroll", reposition);
            window.removeEventListener("resize", reposition);
        };
    }, [positionHandle]);

    // Cleanup on unmount.
    useEffect(() => {
        return () => removeHandle();
    }, [removeHandle]);

    // ── Click handler: select image / deselect on outside click ───────────────
    const handleEditorClick = (e: ReactMouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG") {
            e.preventDefault();
            selectImage(target as HTMLImageElement);
        } else {
            removeHandle();
        }
    };

    // ── Paste pipeline ────────────────────────────────────────────────────────
    const handlePaste = async (e: ClipboardEvent<HTMLDivElement>) => {
        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find(
            (it) => it.kind === "file" && it.type.startsWith("image/")
        );

        if (imageItem) {
            e.preventDefault();
            const file = imageItem.getAsFile();
            if (!file) return;

            if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
                setError("Only PNG, JPEG, GIF, or WEBP.");
                return;
            }
            if (file.size > MAX_FILE_BYTES) {
                setError("Image too large (5 MB max).");
                return;
            }
            setError("");

            // Insert spinner placeholder at the cursor.
            const uploadId = crypto.randomUUID();
            const placeholder = document.createElement("img");
            placeholder.src = SPINNER_DATA_URI;
            placeholder.setAttribute("data-upload-id", uploadId);
            placeholder.setAttribute("width", "48");
            placeholder.alt = "Uploading…";
            placeholder.style.opacity = "0.7";

            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(placeholder);
                range.setStartAfter(placeholder);
                range.setEndAfter(placeholder);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                editorRef.current?.appendChild(placeholder);
            }
            if (editorRef.current) onChange(editorRef.current.innerHTML);

            try {
                const url = await uploadImage(file);
                // Find by data-upload-id (stable under user typing/cursor moves).
                const el = editorRef.current?.querySelector<HTMLImageElement>(
                    `img[data-upload-id="${uploadId}"]`
                );
                if (el) {
                    el.src = url;
                    el.alt = file.name;
                    el.removeAttribute("data-upload-id");
                    el.removeAttribute("width");
                    el.style.opacity = "";
                }
                if (editorRef.current) onChange(editorRef.current.innerHTML);
            } catch (err) {
                const el = editorRef.current?.querySelector(
                    `img[data-upload-id="${uploadId}"]`
                );
                if (el) {
                    const fail = document.createTextNode("[image upload failed]");
                    el.replaceWith(fail);
                }
                setError(err instanceof Error ? err.message : "Upload failed.");
                if (editorRef.current) onChange(editorRef.current.innerHTML);
            }
            return;
        }

        // No image — re-insert clipboard text as plain text to strip Word/Docs garbage.
        const text = e.clipboardData.getData("text/plain");
        if (text) {
            e.preventDefault();
            // execCommand is deprecated but still universally supported and respects
            // the current selection / cursor cleanly. ~10-line swap to Range API later.
            document.execCommand("insertText", false, text);
        }
    };

    // ── Keyboard: Enter inserts <br> instead of <div> for flat DOM ────────────
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            document.execCommand("insertLineBreak");
        }
    };

    // ── Input: pass innerHTML up unchanged. Sanitization runs on submit. ──────
    const handleInput = () => {
        if (!editorRef.current) return;
        // If user typed past the placeholder, reposition handle if image is selected.
        positionHandle();
        onChange(editorRef.current.innerHTML);
    };

    return (
        <>
            <div
                ref={wrapperRef}
                className={`relative bg-white border rounded transition-colors ${
                    isFocused ? "border-primary ring-1 ring-primary/20" : "border-[#dfe1e6]"
                } ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
                style={{
                    resize: "vertical",
                    overflow: "auto",
                    minHeight,
                    maxHeight: 600,
                }}
            >
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    onClick={handleEditorClick}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    data-placeholder={placeholder}
                    className="rte-editor outline-none px-3 py-2 text-[13px] text-[#172b4d] min-h-full"
                    style={{ minHeight }}
                />
            </div>
            {error && (
                <p className="text-[11px] text-red-500 mt-1">{error}</p>
            )}

            {/* Component-scoped styles (not module CSS) for placeholder + image selection. */}
            <style jsx>{`
                .rte-editor:empty::before {
                    content: attr(data-placeholder);
                    color: #97a0af;
                    pointer-events: none;
                }
                .rte-editor :global(img) {
                    max-width: 100%;
                    height: auto;
                    display: inline-block;
                    vertical-align: middle;
                    border-radius: 4px;
                }
                .rte-editor :global(img.rte-img-selected) {
                    outline: 2px dashed #0052cc;
                    outline-offset: 2px;
                }
                .rte-editor :global(p) {
                    margin: 0 0 0.5em 0;
                }
            `}</style>
        </>
    );
}
