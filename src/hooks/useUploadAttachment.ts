"use client";

import { useState, useCallback } from "react";
import { TicketAttachment } from "@/types";
import { apiUpload } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

interface UploadResult {
  attachment: TicketAttachment | null;
  error: string | null;
}

export function useUploadAttachment() {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File, ticketId?: string): Promise<UploadResult> => {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (ticketId) fd.append("ticketId", ticketId);

        const res = await apiUpload(endpoints.attachments, fd);

        if (res.status === 400) {
          const text = await res.text();
          return { attachment: null, error: text || "Invalid file" };
        }
        if (!res.ok) return { attachment: null, error: "Upload failed" };

        const json = await res.json();
        const attachment: TicketAttachment = {
          id: json.id ?? null,
          ticketId: json.ticketId ?? null,
          fileName: json.fileName,
          contentType: json.contentType,
          size: json.size,
          createdAt: new Date().toISOString(),
          userId: "",
          signedUrl: json.signedUrl ?? "",
        };
        return { attachment, error: null };
      } catch (err) {
        return {
          attachment: null,
          error: err instanceof Error ? err.message : "Upload failed",
        };
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return { upload, uploading };
}
