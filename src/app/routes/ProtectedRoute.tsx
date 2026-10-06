import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useAuthStore } from "../../stores/authStore";
import { ROUTES } from "../../lib/routes";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Only logged-in users get through; everyone else is sent to the login page
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return children;
}
