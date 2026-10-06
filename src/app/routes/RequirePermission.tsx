import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { can, type Permission } from "../../lib/permissions";
import { ROUTES, getHomeRoute } from "../../lib/routes";
import { useAuthStore } from "../../stores/authStore";

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
}

// Page-level permission check (UX only). The backend must enforce the same
// rule and answer 403, otherwise anyone could call the API directly.
export function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!can(user, permission)) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return children;
}
