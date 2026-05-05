"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
    Ticket,
    TicketStatus,
    getValidTransitions,
    STATUS_LABELS,
    SpecialistResult,
} from "@/types";
import { useDragResize } from "@/hooks/useDragResize";
import { useAssignees } from "@/hooks/useAssignees";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useTicket } from "@/hooks/useTicket";
import {
    formatDateTime,
    formatRelativeTime,
    formatDueDate,
    getDueDateColor,
    AI_AGENT_IDS,
    AGENT_COLORS,
    AGENT_DISPLAY_NAMES,
    getHumanColor,
    createUserNameResolver,
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

function parseSpecialistResult(content: string): SpecialistResult | null {
    const attempts = [content.trim()];
    const fenced = content.trim();
    if (fenced.startsWith("```")) {
        const nl = fenced.indexOf("\n");
        const end = fenced.lastIndexOf("```");
        if (nl !== -1 && end > nl) attempts.push(fenced.slice(nl + 1, end).trim());
    }
    const s = content.indexOf("{");
    const e = content.lastIndexOf("}");
    if (s !== -1 && e > s) attempts.push(content.slice(s, e + 1));

    for (const a of attempts) {
        try {
            const p = JSON.parse(a) as Record<string, unknown>;
            const workflow = (p.workflow ?? p.Workflow ?? null) as string | null;
            return {
                analysis: (p.analysis ?? p.Analysis ?? "") as string,
                workflow: workflow === "null" || workflow === "" ? null : workflow,
                solutions: (p.solutions ?? p.Solutions ?? []) as string[],
                outOfScope: (p.outOfScope ?? p.OutOfScope ?? false) as boolean,
                suggestedAgents: (p.suggestedAgents ?? p.SuggestedAgents ?? []) as string[],
            };
        } catch {
            /* try next */
        }
    }
    return null;
}

function SpecialistCard({
    agentId,
    content,
    createdAt,
    isLatest,
}: {
    agentId: string;
    content: string;
    createdAt: string;
    isLatest: boolean;
}) {
    const result = parseSpecialistResult(content);
    if (!result) return null;

    const colors = AGENT_COLORS[agentId] ?? {
        backgroundColor: "#9ca3af",
        color: "#ffffff",
        initials: agentId.slice(0, 2).toUpperCase(),
    };
    const name = AGENT_DISPLAY_NAMES[agentId] ?? agentId;

    if (result.outOfScope) {
        return (
            <div className="rounded-lg border border-orange-200 bg-orange-50 overflow-hidden mb-3">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-orange-200">
                    <div
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                        style={{ backgroundColor: colors.backgroundColor, color: colors.color }}
                    >
                        {colors.initials}
                    </div>
                    <span className="text-[12px] font-semibold text-[#172b4d]">{name}</span>
                    <span className="text-[11px] text-orange-600 font-medium ml-auto">
                        Out of scope
                    </span>
                </div>
                <div className="px-3 py-2.5 space-y-2">
                    <p className="text-[12px] text-orange-800">{result.analysis}</p>
                    {result.suggestedAgents && result.suggestedAgents.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-orange-700 font-medium">Try:</span>
                            {result.suggestedAgents.map((a) => (
                                <span
                                    key={a}
                                    className="text-[11px] px-1.5 py-0.5 bg-white border border-orange-200 rounded text-orange-700 font-medium"
                                >
                                    {AGENT_DISPLAY_NAMES[a] ?? a}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border overflow-hidden mb-3 ${isLatest ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50"}`}
        >
            <div
                className={`flex items-center gap-2 px-3 py-2 border-b ${isLatest ? "bg-white border-blue-200" : "bg-white border-gray-200"}`}
            >
                <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: colors.backgroundColor, color: colors.color }}
                >
                    {colors.initials}
                </div>
                <span className="text-[12px] font-semibold text-[#172b4d]">{name}</span>
                {isLatest && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 font-semibold rounded ml-1">
                        Latest
                    </span>
                )}
                <span className="text-[11px] text-[#97a0af] ml-auto">
                    {formatRelativeTime(createdAt)}
                </span>
            </div>
            <div className="px-3 py-3 space-y-3">
                <p className="text-[13px] text-[#42526e] leading-relaxed">{result.analysis}</p>

                {result.workflow && (
                    <div>
                        <div className="text-[10px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5">
                            Workflow
                        </div>
                        <pre className="text-[11px] text-[#172b4d] bg-white border border-gray-200 rounded p-2.5 overflow-x-auto font-mono leading-relaxed whitespace-pre">
                            {result.workflow}
                        </pre>
                    </div>
                )}

                {result.solutions && result.solutions.length > 0 && (
                    <div>
                        <div className="text-[10px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1.5">
                            Recommended steps
                        </div>
                        <ul className="space-y-1">
                            {result.solutions.map((s, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-1.5 text-[12px] text-[#42526e]"
                                >
                                    <span className="text-[#97a0af] flex-shrink-0 mt-0.5">›</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

function OlderAnalysesAccordion({ comments }: { comments: import("@/types").Comment[] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mb-3">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    className={`flex-shrink-0 text-[#5e6c84] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                >
                    <path d="M2 4l4 4 4-4" />
                </svg>
                <span className="text-[12px] text-[#5e6c84] font-medium">
                    {comments.length} older {comments.length === 1 ? "analysis" : "analyses"}
                </span>
            </button>
            <div
                className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
                <div className="overflow-hidden">
                    <div className="mt-2">
                        {comments.map((c) => (
                            <SpecialistCard
                                key={c.id}
                                agentId={c.userId}
                                content={c.content}
                                createdAt={c.createdAt}
                                isLatest={false}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
    const { humans, aiAgents } = useAssignees();
    const { user } = useAuth();

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (statusRef.current && !statusRef.current.contains(e.target as Node))
                setStatusOpen(false);
            if (reassignRef.current && !reassignRef.current.contains(e.target as Node))
                setReassignOpen(false);
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
            if (!res.ok) throw new Error();
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
            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(errText || `Failed to reassign (${res.status})`);
            }
            showToast("Ticket reassigned");
            refetch();
            onMutated?.();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to reassign");
        } finally {
            setAssignSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this ticket? This cannot be undone.")) return;
        try {
            const res = await apiFetch(endpoints.deleteTicket(ticket.id), { method: "DELETE" });
            if (!res.ok) throw new Error();
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

    async function handleDeleteComment(commentId: string) {
        if (!confirm("Delete this comment? This cannot be undone.")) return;
        try {
            const res = await apiFetch(endpoints.deleteComment(ticket.id, commentId), {
                method: "DELETE",
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(errText || `Failed to delete comment (${res.status})`);
            }
            await refetch();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete comment");
        }
    }

    const allComments = data?.comments ?? [];
    const specialistComments = allComments.filter((c) => AI_AGENT_IDS.has(c.userId));
    const userComments = allComments.filter(
        (c) => c.userId !== "ai" && !AI_AGENT_IDS.has(c.userId),
    );

    const hasAiTriage = allComments.some((c) => c.userId === "ai");
    const currentAssignedTo = (data?.ticket ?? ticket).assignedTo;
    const latestSpecialistComment = [...specialistComments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ).at(-1);
    const currentAgentAnalyzed = latestSpecialistComment?.userId === currentAssignedTo;
    const [analysisTimedOut, setAnalysisTimedOut] = useState(false);

    useEffect(() => {
        setAnalysisTimedOut(false);
        if (!hasAiTriage || currentAgentAnalyzed || !AI_AGENT_IDS.has(currentAssignedTo ?? ""))
            return;
        const interval = setInterval(refetch, 3000);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            setAnalysisTimedOut(true);
        }, 30000);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [hasAiTriage, currentAgentAnalyzed, currentAssignedTo, refetch]);

    const resolveUserName = useMemo(() => createUserNameResolver(user, humans), [user, humans]);

    const ticketData = data?.ticket ?? ticket;
    const ticketNum = ticket.id.slice(-4).toUpperCase();

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
                                <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                >
                                    <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
                                </svg>
                            ) : (
                                <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                >
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
                            {/* Title + triage */}
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
                                        {ticketData.ai?.solutions &&
                                            ticketData.ai.solutions.length > 0 && (
                                                <div>
                                                    <div className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-1.5">
                                                        Suggested steps
                                                    </div>
                                                    <ul className="space-y-1">
                                                        {ticketData.ai.solutions.map((s, i) => (
                                                            <li
                                                                key={i}
                                                                className="flex items-start gap-1.5 text-[12px] text-purple-800"
                                                            >
                                                                <span className="text-purple-400 flex-shrink-0 mt-0.5">
                                                                    ›
                                                                </span>
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-purple-100 text-purple-700 cursor-default">
                                                {ticketData.category}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-purple-100 text-purple-700 cursor-default">
                                                {ticketData.priority}
                                            </span>
                                            {ticketData.ai?.assignedTo && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-purple-100 text-purple-700 cursor-default">
                                                    {ticketData.ai.assignedTo}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">
                                            Status
                                        </div>
                                        <StatusBadge status={ticketData.status as TicketStatus} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">
                                            Priority
                                        </div>
                                        <PriorityBadge priority={ticketData.priority} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">
                                            Category
                                        </div>
                                        <CategoryBadge category={ticketData.category} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">
                                            Assigned To
                                        </div>
                                        <AgentChip
                                            agent={ticketData.assignedTo}
                                            resolveUserName={resolveUserName}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">
                                            Due Date
                                        </div>
                                        {ticketData.dueDate ? (
                                            <span
                                                className={`text-[13px] ${getDueDateColor(ticketData.dueDate)}`}
                                            >
                                                {formatDueDate(ticketData.dueDate)}
                                            </span>
                                        ) : (
                                            <span className="text-[13px] text-gray-400">—</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-1.5">
                                            Created
                                        </div>
                                        <span className="text-[13px] text-[#5e6c84]">
                                            {formatDateTime(ticketData.createdAt)} ·{" "}
                                            {formatRelativeTime(ticketData.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="px-5 py-4 border-b border-[#f4f5f7]">
                                <div className="text-[11px] font-semibold text-[#5e6c84] uppercase tracking-[0.06em] mb-2">
                                    Description
                                </div>
                                <p className="text-[13px] text-[#42526e] leading-relaxed whitespace-pre-wrap">
                                    {ticketData.description}
                                </p>
                            </div>

                            {/* Tabs */}
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
                                        {/* Specialist analysis cards */}
                                        {hasAiTriage &&
                                            !currentAgentAnalyzed &&
                                            AI_AGENT_IDS.has(currentAssignedTo ?? "") && (
                                                analysisTimedOut ? (
                                                    <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg border border-orange-200 bg-orange-50 text-[12px] text-orange-700">
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
                                                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                                                        </svg>
                                                        Analysis is taking longer than expected. Reassign to retry.
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg border border-gray-200 bg-gray-50 text-[12px] text-[#5e6c84]">
                                                        <svg
                                                            className="animate-spin flex-shrink-0"
                                                            width="13"
                                                            height="13"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                        >
                                                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                                        </svg>
                                                        Agent analysis in progress...
                                                    </div>
                                                )
                                            )}
                                        {(() => {
                                            const sorted = [...specialistComments].sort(
                                                (a, b) =>
                                                    new Date(a.createdAt).getTime() -
                                                    new Date(b.createdAt).getTime(),
                                            );
                                            const latest = sorted[sorted.length - 1];
                                            const older = sorted.slice(0, -1).reverse();
                                            return (
                                                <>
                                                    {latest && (
                                                        <SpecialistCard
                                                            key={latest.id}
                                                            agentId={latest.userId}
                                                            content={latest.content}
                                                            createdAt={latest.createdAt}
                                                            isLatest
                                                        />
                                                    )}
                                                    {older.length > 0 && (
                                                        <OlderAnalysesAccordion comments={older} />
                                                    )}
                                                </>
                                            );
                                        })()}

                                        {/* User comment form */}
                                        <form
                                            onSubmit={handleAddComment}
                                            className="flex gap-2.5 mb-4"
                                        >
                                            {(() => {
                                                const id = user?.masterId ?? "U";
                                                const c = getHumanColor(id);
                                                const initials = user
                                                    ? `${user.firstName[0]}${user.lastName[0]}`
                                                    : "U";
                                                return (
                                                    <div
                                                        style={c}
                                                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                                                    >
                                                        {initials}
                                                    </div>
                                                );
                                            })()}
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
                                            userComments.map((c) => {
                                                const isOwn = c.userId === user?.masterId;
                                                const displayName = isOwn
                                                    ? `${user!.firstName} ${user!.lastName}`
                                                    : resolveUserName(c.userId);
                                                const nameParts = displayName.trim().split(" ");
                                                const initials =
                                                    nameParts.length >= 2
                                                        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
                                                        : displayName.slice(0, 2);
                                                const hc = getHumanColor(c.userId);
                                                return (
                                                    <div key={c.id} className="flex gap-2.5 mb-4">
                                                        <div
                                                            style={hc}
                                                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                                                        >
                                                            {initials.toUpperCase()}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <span className="text-[12px] font-semibold text-[#172b4d]">
                                                                        {displayName}
                                                                    </span>
                                                                    <span className="text-[11px] text-[#8993a4] ml-2">
                                                                        {formatRelativeTime(
                                                                            c.createdAt,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                {isOwn && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeleteComment(
                                                                                c.id,
                                                                            )
                                                                        }
                                                                        className="text-[11px] text-[#97a0af] hover:text-red-500 transition-colors"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-[13px] text-[#42526e] mt-0.5 leading-relaxed">
                                                                {c.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
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
                                                            <span className="font-medium text-[#172b4d]">
                                                                {resolveUserName(a.userId)}
                                                            </span>{" "}
                                                            {a.action === "StatusChanged" && (
                                                                <>
                                                                    changed status from{" "}
                                                                    <span className="font-medium">
                                                                        {a.fromValue}
                                                                    </span>{" "}
                                                                    to{" "}
                                                                    <span className="font-medium">
                                                                        {a.toValue}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {a.action === "CommentAdded" && (
                                                                <>added a comment</>
                                                            )}
                                                            {a.action === "Reassigned" && (
                                                                <>
                                                                    reassigned from{" "}
                                                                    <span className="font-medium">
                                                                        {a.fromValue}
                                                                    </span>{" "}
                                                                    to{" "}
                                                                    <span className="font-medium">
                                                                        {a.toValue}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {a.action === "AiTriage" && (
                                                                <>
                                                                    ran AI triage and classified
                                                                    this ticket
                                                                </>
                                                            )}
                                                            {![
                                                                "StatusChanged",
                                                                "CommentAdded",
                                                                "Reassigned",
                                                                "AiTriage",
                                                            ].includes(a.action) && <>{a.action}</>}
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

                {/* Footer actions */}
                <div className="px-5 py-3 border-t border-[#dfe1e6] flex items-center gap-2 flex-shrink-0">
                    {isTerminal ? (
                        <StatusBadge status={currentStatus as TicketStatus} />
                    ) : (
                        <div ref={statusRef} className="relative">
                            <button
                                disabled={statusSubmitting}
                                onClick={() => {
                                    setStatusOpen((o) => !o);
                                    setReassignOpen(false);
                                }}
                                className="h-8 px-3 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                Update status
                                <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 10 10"
                                    fill="white"
                                    className={`transition-transform duration-150 ${statusOpen ? "rotate-180" : ""}`}
                                >
                                    <path
                                        d="M2 3.5l3 3 3-3"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </svg>
                            </button>
                            <div
                                className={`absolute bottom-full left-0 mb-1 w-52 bg-white border border-[#dfe1e6] rounded shadow-lg z-50 py-1 transition-all duration-150 origin-bottom ${statusOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
                            >
                                {validTransitions.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            handleStatusChange(s);
                                            setStatusOpen(false);
                                        }}
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
                            onClick={() => {
                                setReassignOpen((o) => !o);
                                setStatusOpen(false);
                            }}
                            className="h-8 px-3 bg-white border border-[#dfe1e6] text-[#42526e] text-[13px] font-medium rounded hover:bg-[#f4f5f7] transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                            Reassign
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                className={`transition-transform duration-150 ${reassignOpen ? "rotate-180" : ""}`}
                            >
                                <path
                                    d="M2 3.5l3 3 3-3"
                                    stroke="#42526e"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                        </button>
                        <div
                            className={`absolute bottom-full left-0 mb-1 w-52 bg-white border border-[#dfe1e6] rounded shadow-lg z-50 py-1 transition-all duration-150 origin-bottom ${reassignOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
                        >
                            {humans.length > 0 && (
                                <>
                                    <div className="px-3 py-1.5 text-[10px] font-semibold text-[#97a0af] uppercase tracking-wide">
                                        Team
                                    </div>
                                    {humans.map((h) => {
                                        const hc = getHumanColor(h.id);
                                        return (
                                            <button
                                                key={h.id}
                                                onClick={() => {
                                                    handleAssign(h.id);
                                                    setReassignOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-[13px] text-[#172b4d] hover:bg-[#f4f5f7] transition-colors flex items-center gap-2"
                                            >
                                                <div
                                                    style={hc}
                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                                >
                                                    {h.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                                {h.name}
                                            </button>
                                        );
                                    })}
                                    <div className="my-1 border-t border-[#f4f5f7]" />
                                </>
                            )}
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-[#97a0af] uppercase tracking-wide">
                                AI Agents
                            </div>
                            {aiAgents.map((a) => {
                                const colors = AGENT_COLORS[a.id] ?? {
                                    backgroundColor: "#9ca3af",
                                    color: "#ffffff",
                                    initials: a.id.slice(0, 2).toUpperCase(),
                                };
                                return (
                                    <button
                                        key={a.id}
                                        onClick={() => {
                                            handleAssign(a.id);
                                            setReassignOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-[13px] text-[#172b4d] hover:bg-[#f4f5f7] transition-colors flex items-center gap-2"
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                            style={{
                                                backgroundColor: colors.backgroundColor,
                                                color: colors.color,
                                            }}
                                        >
                                            {colors.initials}
                                        </div>
                                        {a.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {user?.isAdmin && (
                        <button
                            onClick={handleDelete}
                            className="h-8 px-3 ml-auto bg-white border border-red-200 text-red-600 text-[13px] font-medium rounded hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                    )}
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
