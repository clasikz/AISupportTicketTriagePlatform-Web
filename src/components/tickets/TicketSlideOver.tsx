"use client";

import { useState, useEffect, useRef } from "react";
import { Ticket, TicketStatus, getValidTransitions, STATUS_LABELS } from "@/types";
import { useDragResize } from "@/hooks/useDragResize";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useTicket } from "@/hooks/useTicket";
import {
    formatDateTime,
    formatRelativeTime,
    formatDueDate,
    getDueDateColor,
    AGENT_OPTIONS,
} from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import CategoryBadge from "./CategoryBadge";
import AgentChip from "./AgentChip";
import SlideOverSkeleton from "@/components/skeletons/SlideOverSkeleton";

interface Props {
    ticket: Ticket;
    onClose: () => void;
    onUpdated: () => void;
    onMutated?: () => void;
}

type Tab = "comments" | "activity";

export default function TicketSlideOver({ ticket, onClose, onUpdated, onMutated }: Props) {
    const [tab, setTab] = useState<Tab>("comments");
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [statusSubmitting, setStatusSubmitting] = useState(false);
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [statusOpen, setStatusOpen] = useState(false);
    const [reassignOpen, setReassignOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const statusRef = useRef<HTMLDivElement>(null);
    const reassignRef = useRef<HTMLDivElement>(null);
    const { size: panelW, startDrag: startPanelDrag } = useDragResize(
        "slideover-width",
        540,
        400,
        900,
    );

    const { data, loading, refetch } = useTicket(ticket.id);

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
                setStatusOpen(false);
            }
            if (reassignRef.current && !reassignRef.current.contains(e.target as Node)) {
                setReassignOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const currentStatus = data?.ticket.status ?? ticket.status;
    const validTransitions = getValidTransitions(currentStatus as TicketStatus);
    const isTerminal = validTransitions.length === 0;

    async function handleStatusChange(newStatus: TicketStatus) {
        setStatusSubmitting(true);
        try {
            const res = await apiFetch(endpoints.updateTicket(ticket.id), {
                method: "PUT",
                body: JSON.stringify({
                    title: data?.ticket.title ?? ticket.title,
                    description: data?.ticket.description ?? ticket.description,
                    status: newStatus,
                }),
            });
            if (res.status === 404) {
                showToast("Invalid status transition");
                return;
            }
            if (!res.ok) throw new Error("Failed to update status");
            showToast("Status updated");
            refetch();
            onMutated?.();
        } catch {
            showToast("Failed to update status");
        } finally {
            setStatusSubmitting(false);
        }
    }

    async function handleAssign(agent: string) {
        setAssignSubmitting(true);
        try {
            const res = await apiFetch(endpoints.assignTicket(ticket.id), {
                method: "PUT",
                body: JSON.stringify({ assignedTo: agent }),
            });
            if (!res.ok) throw new Error("Failed to reassign");
            showToast("Ticket reassigned");
            refetch();
            onMutated?.();
        } catch {
            showToast("Failed to reassign");
        } finally {
            setAssignSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this ticket? This cannot be undone.")) return;
        try {
            const res = await apiFetch(endpoints.deleteTicket(ticket.id), { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            onUpdated();
        } catch {
            showToast("Failed to delete ticket");
        }
    }

    async function handleAddComment(e: React.FormEvent) {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            const res = await apiFetch(endpoints.comments(ticket.id), {
                method: "POST",
                body: JSON.stringify({ content: commentText.trim() }),
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(errText || "Failed to add comment");
            }
            setCommentText("");
            await refetch();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    }

    const ticketData = data?.ticket ?? ticket;
    const ticketNum = ticket.id.slice(-4).toUpperCase();
    const userComments = (data?.comments ?? []).filter((c) => c.userId !== "ai");

    return (
        <>
            <div
                className={`fixed inset-0 bg-[#091e42]/30 z-40 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />

            <div
                style={fullscreen ? {} : { width: panelW }}
                className={`fixed bg-white border-l border-[#dfe1e6] shadow-xl z-50 flex flex-col transition-all duration-300 ease-out ${
                    fullscreen
                        ? "inset-0"
                        : `top-12 right-0 bottom-0 ${visible ? "translate-x-0" : "translate-x-full"}`
                }`}
            >
                <div
                    onMouseDown={(e) => startPanelDrag(e, "left")}
                    className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize group z-10"
                >
                    <div className="absolute inset-0 group-hover:bg-primary/25 transition-colors" />
                </div>

                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dfe1e6] flex-shrink-0">
                    <span className="text-[11px] text-[#5e6c84] font-mono">TT-{ticketNum}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFullscreen((f) => !f)}
                            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                            className="w-7 h-7 rounded border border-[#dfe1e6] bg-white hover:bg-[#f4f5f7] text-[#5e6c84] flex items-center justify-center transition-colors"
                        >
                            {fullscreen ? (
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                    <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
                                </svg>
                            ) : (
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                    <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded border border-[#dfe1e6] bg-white hover:bg-[#f4f5f7] text-[#5e6c84] flex items-center justify-center text-base transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <SlideOverSkeleton />
                    ) : (
                        <>
                            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                                <h2 className="text-[16px] font-semibold text-[#172b4d] leading-snug mb-3">
                                    {ticketData.title}
                                </h2>
                                <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-white overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-100/60 border-b border-purple-200">
                                        <div className="w-6 h-6 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white text-base">
                                            ✦
                                        </div>
                                        <span className="text-[12px] font-semibold text-purple-800">
                                            AI Triage
                                        </span>
                                    </div>
                                    <div className="px-3 py-3 space-y-2.5">
                                        {ticketData.ai?.comments && (
                                            <p className="text-[12px] text-purple-900 leading-relaxed">
                                                {ticketData.ai.comments}
                                            </p>
                                        )}
                                        {ticketData.ai?.solutions && ticketData.ai.solutions.length > 0 && (
                                            <div>
                                                <div className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-1.5">
                                                    Suggested steps
                                                </div>
                                                <ul className="space-y-1">
                                                    {ticketData.ai.solutions.map((s, i) => (
                                                        <li key={i} className="flex items-start gap-1.5 text-[12px] text-purple-800">
                                                            <span className="text-purple-400 flex-shrink-0 mt-0.5">›</span>
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 transition-colors duration-150 cursor-default">
                                                {ticketData.category}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 transition-colors duration-150 cursor-default">
                                                {ticketData.priority}
                                            </span>
                                            {ticketData.assignedTo && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 transition-colors duration-150 cursor-default">
                                                    {ticketData.assignedTo}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">Status</div>
                                        <StatusBadge status={ticketData.status as TicketStatus} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">Priority</div>
                                        <PriorityBadge priority={ticketData.priority} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">Category</div>
                                        <CategoryBadge category={ticketData.category} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">Assigned To</div>
                                        <AgentChip agent={ticketData.assignedTo} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">Due Date</div>
                                        {ticketData.dueDate ? (
                                            <span className={`text-[13px] ${getDueDateColor(ticketData.dueDate)}`}>
                                                {formatDueDate(ticketData.dueDate)}
                                            </span>
                                        ) : (
                                            <span className="text-[13px] text-gray-400">—</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">Created</div>
                                        <span className="text-[13px] text-[#5e6c84]">
                                            {formatDateTime(ticketData.createdAt)} · {formatRelativeTime(ticketData.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                                <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-2">Description</div>
                                <p className="text-[13px] text-[#42526e] leading-relaxed whitespace-pre-wrap">
                                    {ticketData.description}
                                </p>
                            </div>

                            <div className="flex border-b border-[#dfe1e6] px-5">
                                <button
                                    onClick={() => setTab("comments")}
                                    className={`py-2.5 mr-4 text-[13px] border-b-2 -mb-px transition-colors ${
                                        tab === "comments"
                                            ? "text-primary border-primary font-medium"
                                            : "text-[#5e6c84] border-transparent hover:text-[#172b4d]"
                                    }`}
                                >
                                    Comments ({userComments.length})
                                </button>
                                <button
                                    onClick={() => setTab("activity")}
                                    className={`py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                                        tab === "activity"
                                            ? "text-primary border-primary font-medium"
                                            : "text-[#5e6c84] border-transparent hover:text-[#172b4d]"
                                    }`}
                                >
                                    Activity ({data?.activities.length ?? 0})
                                </button>
                            </div>

                            <div key={tab} className="px-5 py-4 animate-fade-in">
                                {tab === "comments" && (
                                    <>
                                        <form onSubmit={handleAddComment} className="flex gap-2.5 mb-4">
                                            <div className="w-7 h-7 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
                                                U
                                            </div>
                                            <div className="flex-1">
                                                <textarea
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    placeholder="Add a comment..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] placeholder:text-[#97a0af] bg-[#fafbfc] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
                                                />
                                                {commentText.trim() && (
                                                    <button
                                                        type="submit"
                                                        disabled={submittingComment}
                                                        className="mt-1.5 h-7 px-3 bg-primary hover:bg-primary-dark text-white text-[12px] font-medium rounded transition-colors disabled:opacity-50"
                                                    >
                                                        {submittingComment ? "Saving..." : "Save"}
                                                    </button>
                                                )}
                                            </div>
                                        </form>

                                        {userComments.length === 0 ? (
                                            <p className="text-[13px] text-[#5e6c84] text-center py-4">
                                                No comments yet
                                            </p>
                                        ) : (
                                            userComments.map((c) => (
                                                <div key={c.id} className="flex gap-2.5 mb-4">
                                                    <div className="w-7 h-7 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">
                                                        {c.userId.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div>
                                                            <span className="text-[12px] font-semibold text-[#172b4d]">
                                                                {c.userId}
                                                            </span>
                                                            <span className="text-[11px] text-[#8993a4] ml-2">
                                                                {formatRelativeTime(c.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-[13px] text-[#42526e] mt-0.5 leading-relaxed">
                                                            {c.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}

                                {tab === "activity" && (
                                    <>
                                        {(data?.activities ?? []).length === 0 ? (
                                            <p className="text-[13px] text-[#5e6c84] text-center py-4">
                                                No activity yet
                                            </p>
                                        ) : (
                                            (data?.activities ?? []).map((a) => (
                                                <div key={a.id} className="flex gap-2.5 mb-3">
                                                    <div className="flex flex-col items-center pt-0.5">
                                                        <div className="w-5 h-5 rounded-full bg-[#f4f5f7] border border-[#dfe1e6] flex items-center justify-center flex-shrink-0">
                                                            <div className="w-2 h-2 rounded-full bg-[#97a0af]" />
                                                        </div>
                                                    </div>
                                                    <div className="pt-0.5">
                                                        <p className="text-[12px] text-[#42526e] leading-relaxed">
                                                            <span className="font-medium text-[#172b4d]">{a.userId}</span>{" "}
                                                            {a.action === "StatusChanged" && (
                                                                <>changed status from <span className="font-medium">{a.fromValue}</span> to <span className="font-medium">{a.toValue}</span></>
                                                            )}
                                                            {a.action === "CommentAdded" && <>added a comment</>}
                                                            {a.action === "Reassigned" && (
                                                                <>reassigned from <span className="font-medium">{a.fromValue}</span> to <span className="font-medium">{a.toValue}</span></>
                                                            )}
                                                            {a.action === "AiTriage" && <>ran AI triage and classified this ticket</>}
                                                            {!["StatusChanged", "CommentAdded", "Reassigned", "AiTriage"].includes(a.action) && <>{a.action}</>}
                                                        </p>
                                                        <span className="text-[11px] text-[#97a0af]">
                                                            {formatRelativeTime(a.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-[#dfe1e6] flex items-center gap-2 flex-shrink-0">
                    {isTerminal ? (
                        <StatusBadge status={currentStatus as TicketStatus} />
                    ) : (
                        <div ref={statusRef} className="relative">
                            <button
                                disabled={statusSubmitting}
                                onClick={() => { setStatusOpen((o) => !o); setReassignOpen(false); }}
                                className="h-8 px-3 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                Update status
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="white" className={`transition-transform duration-150 ${statusOpen ? "rotate-180" : ""}`}>
                                    <path d="M2 3.5l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                </svg>
                            </button>
                            <div className={`absolute bottom-full left-0 mb-1 w-52 bg-white border border-[#dfe1e6] rounded shadow-lg z-50 py-1 transition-all duration-150 origin-bottom ${statusOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}>
                                {validTransitions.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { handleStatusChange(s); setStatusOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-[13px] text-[#172b4d] hover:bg-[#f4f5f7] transition-colors"
                                    >
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={reassignRef} className="relative">
                        <button
                            disabled={assignSubmitting}
                            onClick={() => { setReassignOpen((o) => !o); setStatusOpen(false); }}
                            className="h-8 px-3 bg-white border border-[#dfe1e6] text-[#42526e] text-[13px] font-medium rounded hover:bg-[#f4f5f7] transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                            Reassign
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-150 ${reassignOpen ? "rotate-180" : ""}`}>
                                <path d="M2 3.5l3 3 3-3" stroke="#42526e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                            </svg>
                        </button>
                        <div className={`absolute bottom-full left-0 mb-1 w-44 bg-white border border-[#dfe1e6] rounded shadow-lg z-50 py-1 transition-all duration-150 origin-bottom ${reassignOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}>
                            {AGENT_OPTIONS.map((agent) => (
                                <button
                                    key={agent}
                                    onClick={() => { handleAssign(agent); setReassignOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-[13px] text-[#172b4d] hover:bg-[#f4f5f7] transition-colors"
                                >
                                    {agent}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleDelete}
                        className="h-8 px-3 ml-auto bg-white border border-red-200 text-red-600 text-[13px] font-medium rounded hover:bg-red-50 transition-colors"
                    >
                        Delete
                    </button>
                </div>

                {toast && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#172b4d] text-white text-[13px] rounded shadow-lg whitespace-nowrap">
                        {toast}
                    </div>
                )}
            </div>
        </>
    );
}
