import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useAuthStore } from "../../stores/authStore";
import { getHomeRoute } from "../../lib/routes";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

// Opposite of ProtectedRoute: an already logged-in user is sent to their own
// home page instead of seeing the login screen again
export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return children;
}
