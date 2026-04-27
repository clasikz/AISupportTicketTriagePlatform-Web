export enum TicketStatus {
  Open = 0,
  Pending = 1,
  InProgress = 2,
  WaitingForClient = 3,
  WaitingForThirdParty = 4,
  OnHold = 5,
  Resolved = 6,
  Closed = 7,
  Reopened = 8,
  Cancelled = 9,
}

export enum TicketPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical",
}

export enum TicketCategory {
  General = "General",
  Bug = "Bug",
  Billing = "Billing",
  Technical = "Technical",
  Account = "Account",
  FeatureRequest = "FeatureRequest",
}

export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.Open]: [
    TicketStatus.InProgress,
    TicketStatus.Pending,
    TicketStatus.Cancelled,
  ],
  [TicketStatus.Pending]: [TicketStatus.InProgress, TicketStatus.Cancelled],
  [TicketStatus.InProgress]: [
    TicketStatus.Resolved,
    TicketStatus.OnHold,
    TicketStatus.WaitingForClient,
    TicketStatus.WaitingForThirdParty,
  ],
  [TicketStatus.OnHold]: [TicketStatus.InProgress],
  [TicketStatus.WaitingForClient]: [TicketStatus.InProgress],
  [TicketStatus.WaitingForThirdParty]: [TicketStatus.InProgress],
  [TicketStatus.Resolved]: [TicketStatus.Closed, TicketStatus.Reopened],
  [TicketStatus.Reopened]: [TicketStatus.InProgress],
  [TicketStatus.Closed]: [],
  [TicketStatus.Cancelled]: [],
};

export function getValidTransitions(current: TicketStatus): TicketStatus[] {
  return STATUS_TRANSITIONS[current] ?? [];
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.Open]: "Open",
  [TicketStatus.Pending]: "Pending",
  [TicketStatus.InProgress]: "In Progress",
  [TicketStatus.WaitingForClient]: "Waiting for Client",
  [TicketStatus.WaitingForThirdParty]: "Waiting for 3rd Party",
  [TicketStatus.OnHold]: "On Hold",
  [TicketStatus.Resolved]: "Resolved",
  [TicketStatus.Closed]: "Closed",
  [TicketStatus.Reopened]: "Reopened",
  [TicketStatus.Cancelled]: "Cancelled",
};

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
  dueDate: string | null;
  userId: string;
  ai?: AiResult | null;
}

export interface AiResult {
  category: string;
  priority: string;
  assignedTo: string;
  comments: string;
  solutions: string[];
}

export interface CreateTicketResponse {
  ticket: Ticket;
  ai: AiResult | null;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  userId: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  userId: string;
  signedUrl: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
}

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  high: number;
  critical: number;
  tech: number;
  support: number;
  billing: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  search?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: "Asc" | "Desc";
  page?: number;
  pageSize?: number;
}
