"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { TicketAttachment } from "@/types";
import { useUploadAttachment } from "@/hooks/useUploadAttachment";
import { formatBytes } from "@/lib/utils";

// ─── Internal item types ─────────────────────────────────────────────────────

type PendingItem = {
  type: "pending";
  key: string;
  file: File;
  localUrl: string;
};

type UploadingItem = {
  type: "uploading";
  key: string;
  file: File;
  localUrl: string;
};

type DoneItem = {
  type: "done";
  key: string;
  attachment: TicketAttachment;
};

type StripItem = PendingItem | UploadingItem | DoneItem;

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AttachmentStripHandle {
  handlePaste: (e: React.ClipboardEvent) => void;
}

interface Props {
  ticketId?: string;
  initialAttachments?: TicketAttachment[];
  onPendingFilesChange?: (files: File[]) => void;
  onUploaded?: (attachment: TicketAttachment) => void;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isImage(contentType: string): boolean {
  return contentType.startsWith("image/");
}

function keyFor(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Component ───────────────────────────────────────────────────────────────

const AttachmentStrip = forwardRef<AttachmentStripHandle, Props>(
  (
    {
      ticketId,
      initialAttachments = [],
      onPendingFilesChange,
      onUploaded,
      className = "",
    },
    ref
  ) => {
    const [items, setItems] = useState<StripItem[]>(() =>
      initialAttachments.map((a) => ({
        type: "done" as const,
        key: a.id ?? a.fileName,
        attachment: a,
      }))
    );
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload } = useUploadAttachment();

    // Sync new initialAttachments (e.g. after refetch) without duplicating existing done items
    useEffect(() => {
      setItems((prev) => {
        const existingKeys = new Set(prev.map((i) => i.key));
        const newDone: DoneItem[] = initialAttachments
          .filter((a) => !existingKeys.has(a.id ?? a.fileName))
          .map((a) => ({
            type: "done" as const,
            key: a.id ?? a.fileName,
            attachment: a,
          }));
        return newDone.length > 0 ? [...prev, ...newDone] : prev;
      });
    }, [initialAttachments]); // eslint-disable-line react-hooks/exhaustive-deps

    // Revoke object URLs on unmount
    useEffect(() => {
      return () => {
        items.forEach((item) => {
          if ((item.type === "pending" || item.type === "uploading") && item.localUrl) {
            URL.revokeObjectURL(item.localUrl);
          }
        });
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Notify parent of pending files
    useEffect(() => {
      if (!onPendingFilesChange) return;
      const pendingFiles = items
        .filter((i): i is PendingItem => i.type === "pending")
        .map((i) => i.file);
      onPendingFilesChange(pendingFiles);
    }, [items, onPendingFilesChange]);

    const addFiles = useCallback(
      async (files: File[]) => {
        setError(null);
        const oversized = files.filter((f) => f.size > MAX_FILE_BYTES);
        if (oversized.length > 0) {
          setError(
            `File too large (max 10 MB): ${oversized.map((f) => f.name).join(", ")}`
          );
          return;
        }

        if (ticketId) {
          // Immediate upload mode
          for (const file of files) {
            const key = `uploading-${keyFor(file)}-${Date.now()}`;
            const localUrl = isImage(file.type) ? URL.createObjectURL(file) : "";

            setItems((prev) => [
              ...prev,
              { type: "uploading" as const, key, file, localUrl },
            ]);

            const { attachment, error: uploadError } = await upload(file, ticketId);

            if (localUrl) URL.revokeObjectURL(localUrl);

            if (attachment) {
              setItems((prev) =>
                prev.map((item) =>
                  item.key === key
                    ? ({ type: "done" as const, key: attachment.id ?? key, attachment } as DoneItem)
                    : item
                )
              );
              onUploaded?.(attachment);
            } else {
              setItems((prev) => prev.filter((item) => item.key !== key));
              setError(uploadError ?? "Upload failed");
            }
          }
        } else {
          // Pending mode — hold files for parent to upload later
          const newItems: PendingItem[] = files.map((file) => ({
            type: "pending" as const,
            key: `pending-${keyFor(file)}-${Date.now()}`,
            file,
            localUrl: isImage(file.type) ? URL.createObjectURL(file) : "",
          }));
          setItems((prev) => [...prev, ...newItems]);
        }
      },
      [ticketId, upload, onUploaded]
    );

    const removeItem = useCallback((key: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.key === key);
        if (
          item &&
          (item.type === "pending" || item.type === "uploading") &&
          item.localUrl
        ) {
          URL.revokeObjectURL(item.localUrl);
        }
        return prev.filter((i) => i.key !== key);
      });
    }, []);

    // Expose handlePaste via ref
    useImperativeHandle(ref, () => ({
      handlePaste: (e: React.ClipboardEvent) => {
        const imageFiles = Array.from(e.clipboardData.items)
          .filter((item) => item.type.startsWith("image/"))
          .map((item) => item.getAsFile())
          .filter((f): f is File => f !== null);
        if (imageFiles.length > 0) {
          e.preventDefault();
          addFiles(imageFiles);
        }
      },
    }));

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) addFiles(files);
      },
      [addFiles]
    );

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) addFiles(files);
      e.target.value = "";
    };

    const hasItems = items.length > 0;

    return (
      <div className={className}>
        {hasItems && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-wrap gap-2 mb-2"
          >
            {items.map((item) => (
              <Tile key={item.key} item={item} onRemove={removeItem} />
            ))}
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[12px] font-medium text-[#42526e] bg-white border border-[#dfe1e6] rounded hover:bg-[#f4f5f7] transition-colors"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M14 10v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2" />
              <path d="M8 11V3M5 6l3-3 3 3" />
            </svg>
            Attach file
          </button>
          {!hasItems && (
            <span className="text-[11px] text-[#97a0af]">
              or drag & drop · paste images with Ctrl+V
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {error && (
          <p className="text-[11px] text-red-500 mt-1.5">{error}</p>
        )}
      </div>
    );
  }
);

AttachmentStrip.displayName = "AttachmentStrip";
export default AttachmentStrip;

// ─── Tile sub-component ───────────────────────────────────────────────────────

function Tile({
  item,
  onRemove,
}: {
  item: StripItem;
  onRemove: (key: string) => void;
}) {
  const imgContentType =
    item.type === "done" ? item.attachment.contentType : item.file.type;
  const showImage = isImage(imgContentType);

  const imgSrc =
    item.type === "done" ? item.attachment.signedUrl : item.localUrl;

  const name = item.type === "done" ? item.attachment.fileName : item.file.name;
  const size =
    item.type === "done"
      ? formatBytes(item.attachment.size)
      : formatBytes(item.file.size);

  const isUploading = item.type === "uploading";
  const canRemove = item.type === "pending";

  return (
    <div className="relative group w-20 flex-shrink-0">
      <div
        className={`w-20 h-20 rounded border border-[#dfe1e6] bg-[#f4f5f7] flex items-center justify-center overflow-hidden transition-opacity ${
          isUploading ? "opacity-50" : "opacity-100"
        }`}
      >
        {showImage && imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 px-1 text-center">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#97a0af"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-[9px] text-[#97a0af] leading-tight break-all line-clamp-2">
              {name}
            </span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <svg
              className="animate-spin w-5 h-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
          </div>
        )}
      </div>

      <p className="text-[9px] text-[#97a0af] text-center mt-0.5 truncate">{size}</p>

      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.key)}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#42526e] text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}

      {item.type === "done" && item.attachment.signedUrl && (
        <a
          href={item.attachment.signedUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 rounded"
          title={`Open ${item.attachment.fileName}`}
        />
      )}
    </div>
  );
}
