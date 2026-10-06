import { type PropsWithChildren, useEffect } from "react";
import { LoaderCircle } from "lucide-react";

import { GlowBackground } from "../components/layout/GlowBackground";
import { meApi } from "../features/auth/api/meApi";
import { useAuthStore } from "../stores/authStore";

// Runs once on app start: asks the backend whether a session already exists
// (e.g. after a page reload) before any route is rendered, so a logged-in
// user is never flashed the login screen.
export function AuthBootstrap({ children }: PropsWithChildren) {
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const setUser = useAuthStore((state) => state.setUser);
  const resetAuth = useAuthStore((state) => state.resetAuth);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      try {
        const user = await meApi();

        if (isMounted) {
          setUser(user);
        }
      } catch {
        if (isMounted) {
          resetAuth();
        }
      } finally {
        if (isMounted) {
          setBootstrapping(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [setUser, resetAuth, setBootstrapping]);

  if (isBootstrapping) {
    return (
      <GlowBackground className="grid place-items-center">
        <LoaderCircle
          aria-label="Loading"
          className="size-6 animate-spin text-muted-foreground"
        />
      </GlowBackground>
    );
  }

  return children;
}
