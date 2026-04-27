import { Ticket, TicketCategory, TicketPriority, TicketStatus, STATUS_LABELS } from "@/types";

const PRIORITY_FROM_INT: Record<number, TicketPriority> = {
  0: TicketPriority.Low,
  1: TicketPriority.Medium,
  2: TicketPriority.High,
  3: TicketPriority.Critical,
};

const CATEGORY_FROM_INT: Record<number, TicketCategory> = {
  0: TicketCategory.General,
  1: TicketCategory.Bug,
  2: TicketCategory.Billing,
  3: TicketCategory.Technical,
  4: TicketCategory.Account,
  5: TicketCategory.FeatureRequest,
};

export function unwrapTicket(raw: unknown): Ticket {
  if (raw && typeof raw === "object" && "ticket" in raw) {
    const w = raw as { ticket: Ticket; ai?: unknown };
    return { ...w.ticket, ai: w.ai as Ticket["ai"] };
  }
  return raw as Ticket;
}

export function normalizeTicket(t: Ticket): Ticket {
  return {
    ...t,
    priority:
      typeof t.priority === "number"
        ? (PRIORITY_FROM_INT[t.priority as unknown as number] ?? t.priority)
        : t.priority,
    category:
      typeof t.category === "number"
        ? (CATEGORY_FROM_INT[t.category as unknown as number] ?? t.category)
        : t.category,
  };
}

export function getDueDateColor(dueDate: string): string {
  const diff = (new Date(dueDate).getTime() - Date.now()) / 3_600_000;
  if (diff < 0) return "text-red-600 font-semibold";
  if (diff < 48) return "text-orange-500 font-semibold";
  return "text-gray-500";
}

export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const now = new Date();
  const diffHours = (date.getTime() - now.getTime()) / 3_600_000;

  if (diffHours < 0) {
    return `Overdue · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (diffHours < 24) {
    return `Today ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  if (diffHours < 48) {
    return `Tomorrow ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatRelativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStatusLabel(status: TicketStatus): string {
  return STATUS_LABELS[status] ?? String(status);
}

export function buildTicketQuery(filters: {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: "Asc" | "Desc";
  page?: number;
  pageSize?: number;
}): string {
  const params = new URLSearchParams();
  if (filters.status !== undefined) params.set("status", String(filters.status));
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  return params.toString();
}

export const AGENT_OPTIONS = ["support_agent", "tech_agent", "billing_agent"] as const;
export type AgentOption = (typeof AGENT_OPTIONS)[number];

export const AGENT_COLORS: Record<AgentOption, { bg: string; text: string; initials: string }> = {
  support_agent: { bg: "bg-cyan-500", text: "text-white", initials: "SA" },
  tech_agent: { bg: "bg-green-500", text: "text-white", initials: "TA" },
  billing_agent: { bg: "bg-orange-400", text: "text-white", initials: "BA" },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
