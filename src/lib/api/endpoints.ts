// Backend (FastAPI) paths. No trailing slashes: they must match the route
// definitions exactly, otherwise FastAPI answers with a 307 redirect.

export const AUTH_ENDPOINTS = {
  google: "/auth/google",
  logout: "/auth/logout",
  refresh: "/auth/refresh",
  me: "/auth/me",
} as const;

export const TASK_ENDPOINTS = {
  list: "/tasks",
  create: "/tasks",
  detail: (id: number) => `/tasks/${id}`,
  status: (id: number) => `/tasks/${id}/status`,
} as const;

export const CLIENT_ENDPOINTS = {
  list: "/clients",
  create: "/clients",
  detail: (id: number) => `/clients/${id}`,
} as const;

export const NOTIFICATION_ENDPOINTS = {
  list: "/notifications",
  markRead: (id: number) => `/notifications/${id}/read`,
  readAll: "/notifications/read-all",
} as const;

export const REPORT_ENDPOINTS = {
  summary: "/reports/summary",
} as const;

export const TEAM_ENDPOINTS = {
  list: "/teams",
  permissions: (id: number) => `/teams/${id}/permissions`,
} as const;

export const USER_ENDPOINTS = {
  list: "/users",
  create: "/users",
  detail: (id: number) => `/users/${id}`,
} as const;
