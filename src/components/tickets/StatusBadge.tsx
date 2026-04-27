import { TicketStatus, STATUS_LABELS } from "@/types";

const STATUS_STYLES: Record<TicketStatus, { dot: string; badge: string }> = {
  [TicketStatus.Open]:                 { dot: "bg-primary",      badge: "bg-blue-50 text-primary" },
  [TicketStatus.Pending]:              { dot: "bg-orange-400",   badge: "bg-orange-50 text-orange-700" },
  [TicketStatus.InProgress]:           { dot: "bg-green-500",    badge: "bg-green-50 text-green-700" },
  [TicketStatus.WaitingForClient]:     { dot: "bg-yellow-400",   badge: "bg-yellow-50 text-yellow-700" },
  [TicketStatus.WaitingForThirdParty]: { dot: "bg-yellow-400",   badge: "bg-yellow-50 text-yellow-700" },
  [TicketStatus.OnHold]:               { dot: "bg-gray-400",     badge: "bg-gray-100 text-gray-600" },
  [TicketStatus.Resolved]:             { dot: "bg-gray-400",     badge: "bg-gray-100 text-gray-500" },
  [TicketStatus.Closed]:               { dot: "bg-gray-300",     badge: "bg-gray-100 text-gray-400" },
  [TicketStatus.Reopened]:             { dot: "bg-purple-400",   badge: "bg-purple-50 text-purple-700" },
  [TicketStatus.Cancelled]:            { dot: "bg-red-300",      badge: "bg-red-50 text-red-400" },
};

interface Props {
  status: TicketStatus;
}

export default function StatusBadge({ status }: Props) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES[TicketStatus.Open];
  return (
    <span className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded text-[11px] font-medium whitespace-nowrap ${styles.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
