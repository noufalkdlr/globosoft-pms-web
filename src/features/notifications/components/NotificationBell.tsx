import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Bell } from "lucide-react";

import { useNotifications } from "../hooks/useNotifications";
import { useNotificationToasts } from "../hooks/useNotificationToasts";
import { getPanelPosition } from "../lib/panelPosition";
import { NotificationPanel } from "./NotificationPanel";

// The bell with the number of unread notifications. It asks for news every
// half minute, and announces anything that arrives while the app is open.
export function NotificationBell() {
  // null while closed, otherwise where the open panel goes
  const [panelPosition, setPanelPosition] = useState<CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const query = useNotifications();
  useNotificationToasts(query.data?.items);

  const unread = query.data?.unread_count ?? 0;
  const close = useCallback(() => setPanelPosition(null), []);
  const isOpen = panelPosition !== null;

  function handleClick() {
    const rect = buttonRef.current?.getBoundingClientRect();

    setPanelPosition(isOpen || !rect ? null : getPanelPosition(rect));
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={handleClick}
        className="relative grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
      >
        <Bell className="size-5" aria-hidden="true" />

        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-5 text-brand-foreground shadow-brand-glow"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {panelPosition && (
        <NotificationPanel
          anchor={buttonRef}
          position={panelPosition}
          query={query}
          onClose={close}
        />
      )}
    </>
  );
}
