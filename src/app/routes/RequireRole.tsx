import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useAuthStore } from "../../stores/authStore";
import { ROUTES, getHomeRoute } from "../../lib/routes";

import type { UserRole } from "../../features/auth/types/authTypes";

interface RequireRoleProps {
  role: UserRole;
  children: ReactNode;
}

// Page-level role check (UX only). The backend must enforce the same rule
// and answer 403, otherwise anyone could call the API directly.
export function RequireRole({ role, children }: RequireRoleProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (user.role !== role) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return children;
}
