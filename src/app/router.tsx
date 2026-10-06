import { createBrowserRouter, Navigate, Outlet } from "react-router";

import { ROUTES } from "../lib/routes";
import { LoginRoute } from "./routes/public/LoginRoute";
import { BoardRoute } from "./routes/BoardRoute";
import { DashboardRoute } from "./routes/DashboardRoute";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";
import { RequireRole } from "./routes/RequireRole";

export const router = createBrowserRouter([
  {
    // Layout route: the guard renders once and wraps every child via <Outlet />,
    // so new public pages only need to be added to `children`
    element: (
      <PublicOnlyRoute>
        <Outlet />
      </PublicOnlyRoute>
    ),
    children: [
      { path: ROUTES.root, element: <Navigate to={ROUTES.login} replace /> },
      { path: ROUTES.login, element: <LoginRoute /> },
    ],
  },
  {
    // Everything inside requires a logged-in user
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.board, element: <BoardRoute /> },
      {
        // Reports are admin-only
        element: (
          <RequireRole role="admin">
            <Outlet />
          </RequireRole>
        ),
        children: [{ path: ROUTES.dashboard, element: <DashboardRoute /> }],
      },
    ],
  },
  // Unknown URLs go to "/", which then forwards to login or the user's home
  { path: "*", element: <Navigate to={ROUTES.root} replace /> },
]);
