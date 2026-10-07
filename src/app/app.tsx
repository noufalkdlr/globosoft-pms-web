import { RouterProvider } from "react-router/dom";

import { MobileAppGate } from "../components/layout/MobileAppGate";
import { ToastHost } from "../components/ui/ToastHost";
import { AppProviders } from "./provider";
import { AuthBootstrap } from "./auth-bootstrap";
import { router } from "./router";

export function App() {
  return (
    <AppProviders>
      {/* On a phone with a store address set, offers the app before the web app */}
      <MobileAppGate>
        <AuthBootstrap>
          <RouterProvider router={router} />
        </AuthBootstrap>
      </MobileAppGate>
      <ToastHost />
    </AppProviders>
  );
}
