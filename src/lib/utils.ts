import { Ticket, TicketCategory, TicketPriority, TicketStatus, STATUS_LABELS, User, HumanAssignee } from "@/types";

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

export const AI_AGENT_IDS = new Set([
    "support_agent",
    "tech_agent",
    "billing_agent",
    "security_agent",
    "refund_agent",
    "onboarding_agent",
    "infra_agent",
    "integration_agent",
    "compliance_agent",
]);

export const AGENT_COLORS: Record<string, { backgroundColor: string; color: string; initials: string }> = {
    support_agent:    { backgroundColor: "#06b6d4", color: "#ffffff", initials: "SA" },
    tech_agent:       { backgroundColor: "#22c55e", color: "#ffffff", initials: "TA" },
    billing_agent:    { backgroundColor: "#fb923c", color: "#ffffff", initials: "BA" },
    security_agent:   { backgroundColor: "#ef4444", color: "#ffffff", initials: "SE" },
    refund_agent:     { backgroundColor: "#fb7185", color: "#ffffff", initials: "RA" },
    onboarding_agent: { backgroundColor: "#14b8a6", color: "#ffffff", initials: "OA" },
    infra_agent:      { backgroundColor: "#6366f1", color: "#ffffff", initials: "IA" },
    integration_agent:{ backgroundColor: "#8b5cf6", color: "#ffffff", initials: "IN" },
    compliance_agent: { backgroundColor: "#f59e0b", color: "#ffffff", initials: "CA" },
};

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
    support_agent: "Support Agent",
    tech_agent: "Tech Agent",
    billing_agent: "Billing Agent",
    security_agent: "Security Agent",
    refund_agent: "Refund Agent",
    onboarding_agent: "Onboarding Agent",
    infra_agent: "Infrastructure Agent",
    integration_agent: "Integration Agent",
    compliance_agent: "Compliance Agent",
};

const HUMAN_AVATAR_HEX = [
    "#2563EB", // blue
    "#9333EA", // purple
    "#DB2777", // pink
    "#0369A1", // sky
    "#0D9488", // teal
    "#C026D3", // fuchsia
    "#047857", // emerald
    "#E11D48", // rose
];

export function getHumanColor(id: string): { backgroundColor: string; color: string } {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return { backgroundColor: HUMAN_AVATAR_HEX[hash % HUMAN_AVATAR_HEX.length], color: "#ffffff" };
}

export function createUserNameResolver(user: User | null, humans: HumanAssignee[]) {
    const map = Object.fromEntries(humans.map((h) => [h.id, h.name]));
    return (id: string): string => {
        if (user && id === user.masterId) return `${user.firstName} ${user.lastName}`;
        return map[id] ?? id;
    };
}

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
