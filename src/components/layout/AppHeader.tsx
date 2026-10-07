import { NotificationBell } from "../../features/notifications/components/NotificationBell";
import { LogoMark } from "../ui/LogoMark";
import { UserMenu } from "./UserMenu";

import type { AuthUser } from "../../features/auth/types/authTypes";

interface AppHeaderProps {
  user: AuthUser;
}

// The strip at the top of every logged-in page: the bell and the signed-in
// person on the right, like a dashboard. It stays in view while the page
// scrolls, and has no colour or line of its own: only a blur that fades out
// below it, so whatever scrolls underneath is softened, not cut off.
export function AppHeader({ user }: AppHeaderProps) {
  return (
    // Same side padding as <main>, so the header lines up with the page. The
    // wide screen's left padding clears the sidebar.
    <header className="sticky top-0 z-20 px-5 md:pl-[17.5rem] md:pr-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+1.25rem)] backdrop-blur-lg [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent)] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />

      <div className="flex h-14 items-center">
        {/* On a phone there is no sidebar to carry the name of the app */}
        <div className="flex items-center gap-2.5 md:hidden">
          <LogoMark />
          <span className="font-semibold">Globosoft PMS</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <NotificationBell />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
