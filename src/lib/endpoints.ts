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
  deleteComment: (ticketId: string, commentId: string) => `${BASE}/api/tickets/${ticketId}/comments/${commentId}`,
  activities: (id: string) => `${BASE}/api/tickets/${id}/activities`,
  stats: `${BASE}/api/tickets/stats`,
  dashboard: `${BASE}/api/tickets/dashboard`,
  assignees: `${BASE}/api/assignees`,
  users: `${BASE}/api/users`,
  updateUser: (masterId: string) => `${BASE}/api/users/${masterId}`,
  deleteUser: (masterId: string) => `${BASE}/api/users/${masterId}`,
};
