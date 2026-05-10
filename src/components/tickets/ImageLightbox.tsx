"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
    src: string;
    alt?: string;
    onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: Props) {
    // Mount-gate so we only access `document` on the client. The lightbox is
    // rendered through a portal into <body> to escape any transformed
    // ancestor (e.g. the slide-over panel uses `translate-x-*`, which would
    // otherwise become the containing block for our `position: fixed`
    // overlay and clip it to the panel instead of the viewport).
    const [mounted, setMounted] = useState(false);
    // `visible` drives the open/close animation. Flipped on next frame after
    // mount so the entry transition runs from the unmounted state.
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setMounted(true);
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const handleClose = () => {
        // Play the exit animation, then unmount via parent after it finishes.
        setVisible(false);
        window.setTimeout(onClose, 180);
    };

    // ESC to close.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Lock body scroll while the lightbox is open.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    if (!mounted) return null;

    const overlay = (
        <div
            onClick={handleClose}
            className={`fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-6 cursor-zoom-out transition-opacity duration-200 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt ?? ""}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-[90vw] max-h-[90vh] object-contain rounded shadow-xl cursor-default transition-all duration-200 ease-out ${
                    visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
            />
            <button
                onClick={handleClose}
                className={`absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#172b4d] flex items-center justify-center text-base transition-all duration-200 ${
                    visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    );

    return createPortal(overlay, document.body);
}
