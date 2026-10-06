import { createBrowserRouter, Navigate, Outlet } from "react-router";

import { ROUTES } from "../lib/routes";
import { AppShell } from "../components/layout/AppShell";
import { LoginRoute } from "./routes/public/LoginRoute";
import { BoardRoute } from "./routes/BoardRoute";
import { CalendarRoute } from "./routes/CalendarRoute";
import { ClientsRoute } from "./routes/ClientsRoute";
import { DashboardRoute } from "./routes/DashboardRoute";
import { HomeRoute } from "./routes/HomeRoute";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";
import { RequirePermission } from "./routes/RequirePermission";
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
    // Layout route: the auth guard wraps AppShell (sidebar / bottom bar),
    // which renders whichever page is active through its own <Outlet />
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        // Home is the members' landing page; admins have the dashboard instead
        element: (
          <RequireRole role="member">
            <Outlet />
          </RequireRole>
        ),
        children: [{ path: ROUTES.home, element: <HomeRoute /> }],
      },
      { path: ROUTES.board, element: <BoardRoute /> },
      { path: ROUTES.clients, element: <ClientsRoute /> },
      {
        // The content calendar is for people who write cards
        element: (
          <RequirePermission permission="can_create_content">
            <Outlet />
          </RequirePermission>
        ),
        children: [{ path: ROUTES.calendar, element: <CalendarRoute /> }],
      },
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
