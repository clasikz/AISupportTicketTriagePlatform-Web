import { TicketCategory } from "@/types";

const STYLES: Record<TicketCategory, string> = {
  [TicketCategory.Technical]:      "bg-purple-50 text-purple-700",
  [TicketCategory.Bug]:            "bg-red-50 text-red-600",
  [TicketCategory.Billing]:        "bg-orange-50 text-orange-700",
  [TicketCategory.Account]:        "bg-blue-50 text-blue-700",
  [TicketCategory.FeatureRequest]: "bg-green-50 text-green-700",
  [TicketCategory.General]:        "bg-gray-100 text-gray-600",
};

const LABELS: Record<TicketCategory, string> = {
  [TicketCategory.FeatureRequest]: "Feature Request",
  [TicketCategory.Technical]:      "Technical",
  [TicketCategory.Bug]:            "Bug",
  [TicketCategory.Billing]:        "Billing",
  [TicketCategory.Account]:        "Account",
  [TicketCategory.General]:        "General",
};

export default function CategoryBadge({ category }: { category: TicketCategory }) {
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded text-[11px] font-medium whitespace-nowrap ${STYLES[category]}`}>
      {LABELS[category]}
    </span>
  );
}
