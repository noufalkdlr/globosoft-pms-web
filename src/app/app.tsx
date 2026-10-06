import { RouterProvider } from "react-router/dom";

import { ToastHost } from "../components/ui/ToastHost";
import { AppProviders } from "./provider";
import { AuthBootstrap } from "./auth-bootstrap";
import { router } from "./router";

export function App() {
  return (
    <AppProviders>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
      <ToastHost />
    </AppProviders>
  );
}
