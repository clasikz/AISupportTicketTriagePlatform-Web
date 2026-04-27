import { TicketPriority } from "@/types";

const STYLES: Record<TicketPriority, string> = {
  [TicketPriority.Critical]: "bg-red-50 text-red-700",
  [TicketPriority.High]:     "bg-orange-50 text-orange-700",
  [TicketPriority.Medium]:   "bg-yellow-50 text-yellow-700",
  [TicketPriority.Low]:      "bg-green-50 text-green-700",
};

export default function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded text-[11px] font-semibold whitespace-nowrap ${STYLES[priority]}`}>
      {priority}
    </span>
  );
}
