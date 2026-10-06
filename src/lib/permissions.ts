import type { AuthUser, Team } from "../features/auth/types/authTypes";

// Every permission flag a team can carry. Derived from the Team type, so a
// flag added there becomes a valid permission here automatically.
export type Permission = Exclude<keyof Team, "id" | "name">;

// Single place that answers "may this user do X?".
// Admins have no team, so they are checked by role first and allowed
// everything; everyone else depends on their team's flags.
// This only decides what the UI shows. The backend must enforce the same
// rules and answer 403, otherwise anyone could call the API directly.
export function can(
  user: AuthUser | null | undefined,
  permission: Permission,
): boolean {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  return user.team?.[permission] ?? false;
}
