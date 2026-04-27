import { Ticket, TicketStatus } from "@/types";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import CategoryBadge from "./CategoryBadge";
import AgentChip from "./AgentChip";
import { formatDueDate, getDueDateColor, formatRelativeTime } from "@/lib/utils";

interface Props {
    ticket: Ticket;
    selected: boolean;
    onClick: () => void;
}

export default function TicketTableRow({ ticket, selected, onClick }: Props) {
    const ticketNum = ticket.id.slice(-4).toUpperCase();
    const cellBase =
        "py-2.5 min-h-[52px] px-3 border-b border-[#f4f5f7] border-r border-r-[#f0f1f3] transition-colors align-top";
    const cellBg = selected ? "bg-[#e8f0fe]" : "group-hover:bg-[#eef0ff]";

    return (
        <tr onClick={onClick} className="cursor-pointer group">
            <td className={`${cellBase} ${cellBg}`}>
                <span className="text-[11px] text-[#5e6c84] font-mono">TT-{ticketNum}</span>
            </td>
            <td className={`${cellBase} ${cellBg}`}>
                <div className="text-[13px] font-medium text-[#172b4d] leading-snug">
                    {ticket.title}
                </div>
                <div className="text-[11px] text-[#8993a4] mt-0.5">{ticket.userId}</div>
            </td>
            <td className={`${cellBase} ${cellBg}`}>
                <StatusBadge status={ticket.status as TicketStatus} />
            </td>
            <td className={`${cellBase} ${cellBg}`}>
                <PriorityBadge priority={ticket.priority} />
            </td>
            <td className={`${cellBase} ${cellBg}`}>
                <CategoryBadge category={ticket.category} />
            </td>
            <td className={`${cellBase} ${cellBg}`}>
                <AgentChip agent={ticket.assignedTo} />
            </td>
            <td className={`${cellBase} ${cellBg}`}>
                {ticket.dueDate ? (
                    <span className={`text-[12px] ${getDueDateColor(ticket.dueDate)}`}>
                        {formatDueDate(ticket.dueDate)}
                    </span>
                ) : (
                    <span className="text-[12px] text-gray-400">—</span>
                )}
            </td>
            <td className={`${cellBase} ${cellBg}`}>
                <span className="text-[12px] text-[#5e6c84]">
                    {formatRelativeTime(ticket.createdAt)}
                </span>
            </td>
            <td
                className={`py-2.5 min-h-[52px] px-3 border-b border-[#f4f5f7] text-center transition-colors align-top ${cellBg}`}
            >
                <span className="inline-flex items-center gap-1 h-5 px-2 bg-purple-50 text-purple-700 rounded-full text-[11px] font-medium">
                    <span className="text-base">✦</span> Auto
                </span>
            </td>
        </tr>
    );
}
