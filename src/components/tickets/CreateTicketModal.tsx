"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { Ticket, AiResult, CreateTicketResponse } from "@/types";
import { apiFetch } from "@/lib/api";
import { useUploadAttachment } from "@/hooks/useUploadAttachment";
import { endpoints } from "@/lib/endpoints";
import { formatDueDate } from "@/lib/utils";
import PriorityBadge from "./PriorityBadge";
import CategoryBadge from "./CategoryBadge";
import AgentChip from "./AgentChip";
import AttachmentStrip, { AttachmentStripHandle } from "./AttachmentStrip";

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export default function CreateTicketModal({ onClose, onCreated }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState<Ticket | null>(null);
    const [aiResult, setAiResult] = useState<AiResult | null>(null);
    const [visible, setVisible] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [uploadFailCount, setUploadFailCount] = useState(0);
    const stripRef = useRef<AttachmentStripHandle>(null);
    const { upload } = useUploadAttachment();

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const titleError =
        title.length > 0 && (title.length < 3 || title.length > 150)
            ? `Title must be 3–150 characters (${title.length})`
            : "";
    const descError =
        description.length > 0 && (description.length < 10 || description.length > 4000)
            ? `Description must be 10–4000 characters (${description.length})`
            : "";
    const canSubmit =
        title.length >= 3 &&
        title.length <= 150 &&
        description.length >= 10 &&
        description.length <= 4000 &&
        !submitting;

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError("");
        try {
            const res = await apiFetch(endpoints.createTicket, {
                method: "POST",
                body: JSON.stringify({ title: title.trim(), description: description.trim() }),
            });
            if (!res.ok) throw new Error("Failed to create ticket");
            const response: CreateTicketResponse = await res.json();

            // Upload pending attachments with the new ticket ID
            if (pendingFiles.length > 0) {
                let failures = 0;
                for (const file of pendingFiles) {
                    const { attachment } = await upload(file, response.ticket.id);
                    if (!attachment) failures++;
                }
                setUploadFailCount(failures);
            }

            setCreated(response.ticket);
            setAiResult(response.ai);
        } catch {
            setError("Failed to create ticket. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <div
                className={`fixed inset-0 bg-[#091e42]/40 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
            >
                <div
                    className={`w-full max-w-lg bg-white rounded shadow-xl transition-all duration-200 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#dfe1e6]">
                        <h2 className="text-[15px] font-semibold text-[#172b4d]">
                            {created ? "Ticket Created" : "Create Ticket"}
                        </h2>
                        <button
                            onClick={created ? onCreated : onClose}
                            className="w-7 h-7 rounded border border-[#dfe1e6] hover:bg-[#f4f5f7] text-[#5e6c84] flex items-center justify-center text-base transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {created ? (
                        /* Success state */
                        <div className="px-5 py-5">
                            <h3 className="text-[14px] font-semibold text-[#172b4d] mb-3">
                                {created.title}
                            </h3>

                            <div className="grid grid-cols-2 gap-3 text-[13px] mb-4">
                                <div>
                                    <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                        Category
                                    </div>
                                    <CategoryBadge category={created.category} />
                                </div>
                                <div>
                                    <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                        Priority
                                    </div>
                                    <PriorityBadge priority={created.priority} />
                                </div>
                                <div>
                                    <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                        Assigned To
                                    </div>
                                    <AgentChip agent={created.assignedTo} />
                                </div>
                                <div>
                                    <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                        Due Date
                                    </div>
                                    <span className="text-[13px] text-[#5e6c84]">
                                        {created.dueDate ? formatDueDate(created.dueDate) : "—"}
                                    </span>
                                </div>
                            </div>

                            {/* AI rationale */}
                            <div className="rounded border border-purple-100 bg-purple-50 px-3 py-3 space-y-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 uppercase tracking-wide">
                                    <span className="text-[9px]">✦</span> AI Triage Rationale
                                </div>
                                {aiResult?.comments && (
                                    <p className="text-[12px] text-purple-800 leading-relaxed">
                                        {aiResult.comments}
                                    </p>
                                )}
                                {aiResult?.solutions && aiResult.solutions.length > 0 && (
                                    <div>
                                        <div className="text-[11px] font-semibold text-purple-700 mb-1">
                                            Suggested next steps
                                        </div>
                                        <ul className="space-y-0.5">
                                            {aiResult.solutions.map((s, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-1.5 text-[12px] text-purple-800"
                                                >
                                                    <span className="mt-0.5 text-purple-400 flex-shrink-0">
                                                        ›
                                                    </span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {uploadFailCount > 0 && (
                                <p className="mt-3 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                    Ticket created, but {uploadFailCount} file{uploadFailCount > 1 ? "s" : ""} failed to upload.
                                </p>
                            )}

                            <button
                                onClick={onCreated}
                                className="mt-4 w-full h-9 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium rounded transition-colors"
                            >
                                View board
                            </button>
                        </div>
                    ) : (
                        /* Create form */
                        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                            <div>
                                <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Brief summary of the issue"
                                    className="w-full h-9 px-3 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] placeholder:text-[#97a0af] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    autoFocus
                                />
                                {titleError && (
                                    <p className="text-[11px] text-red-500 mt-1">{titleError}</p>
                                )}
                                <p className="text-[11px] text-[#97a0af] mt-1 text-right">
                                    {title.length}/150
                                </p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Detailed description of the issue..."
                                    rows={5}
                                    className="w-full px-3 py-2 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] placeholder:text-[#97a0af] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                                    onPaste={(e) => stripRef.current?.handlePaste(e)}
                                />
                                {descError && (
                                    <p className="text-[11px] text-red-500 mt-1">{descError}</p>
                                )}
                                <p className="text-[11px] text-[#97a0af] mt-1 text-right">
                                    {description.length}/4000
                                </p>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5">
                                    Attachments
                                </label>
                                <AttachmentStrip
                                    ref={stripRef}
                                    onPendingFilesChange={setPendingFiles}
                                />
                            </div>

                            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded text-[12px] text-purple-700">
                                <span className="text-[10px]">✦</span>
                                AI will automatically assign category, priority, and agent on
                                creation.
                            </div>

                            {error && (
                                <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-9 bg-white border border-[#dfe1e6] text-[#42526e] text-[13px] font-medium rounded hover:bg-[#f4f5f7] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="flex-1 h-9 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Creating..." : "Create ticket"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
