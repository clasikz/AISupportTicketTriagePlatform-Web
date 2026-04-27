const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export const endpoints = {
  login: `${BASE}/api/auth/login`,
  refresh: `${BASE}/api/auth/refresh`,
  tickets: (query: string) => `${BASE}/api/tickets?${query}`,
  ticket: (id: string) => `${BASE}/api/tickets/${id}`,
  createTicket: `${BASE}/api/tickets`,
  updateTicket: (id: string) => `${BASE}/api/tickets/${id}`,
  deleteTicket: (id: string) => `${BASE}/api/tickets/${id}`,
  assignTicket: (id: string) => `${BASE}/api/tickets/${id}/assign`,
  comments: (id: string) => `${BASE}/api/tickets/${id}/comments`,
  activities: (id: string) => `${BASE}/api/tickets/${id}/activities`,
stats: `${BASE}/api/tickets/stats`,
  dashboard: `${BASE}/api/tickets/dashboard`,
};
