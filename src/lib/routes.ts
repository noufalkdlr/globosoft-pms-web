import type { AuthUser } from "../features/auth/types/authTypes";

// Frontend page paths. Reference these everywhere, never hard-code a path.
export const ROUTES = {
  root: "/",
  login: "/login",
  board: "/board",
  clients: "/clients",
  dashboard: "/dashboard",

  admin: {
    users: "/admin/users",
    teams: "/admin/teams",
  },
} as const;

// Single place that decides where a user lands after login.
// Admins see the reports dashboard; everyone else lands on the task board.
export function getHomeRoute(user: Pick<AuthUser, "role">) {
  return user.role === "admin" ? ROUTES.dashboard : ROUTES.board;
}
