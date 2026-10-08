import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";

import { Button } from "../../../components/ui/Button";
import { useDismissable } from "../../../hooks/useDismissable";
import { getCurrentMonth } from "../../../utils/month";
import { boardLinkFor } from "../../tasks/lib/taskLinks";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../hooks/useMarkNotifications";
import { NotificationItem } from "./NotificationItem";

import type { useNotifications } from "../hooks/useNotifications";
import type { NotificationRecord } from "../types/notificationTypes";

interface NotificationPanelProps {
  // The bell button the panel hangs from
  anchor: RefObject<HTMLButtonElement | null>;
  position: CSSProperties;
  query: ReturnType<typeof useNotifications>;
  onClose: () => void;
}

// The list that opens from the bell. It is drawn straight onto the page (a
// portal) so the sidebar's frosted glass cannot clip or reposition it.
export function NotificationPanel({
  anchor,
  position,
  query,
  onClose,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const data = query.data;

  // Keyboard and mouse ways out. Escape puts focus back on the bell. The
  // position was worked out for this window width, so a change of width closes
  // the list rather than let it drift.
  useDismissable([panelRef, anchor], onClose, {
    returnFocusTo: anchor,
    closeOnWidthChange: true,
  });

  // The list takes focus as it opens, so the keyboard works inside it
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function handleOpen(notification: NotificationRecord) {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }

    onClose();

    // A deleted card has nowhere to go: the line is just marked read
    if (notification.task) {
      navigate(boardLinkFor(notification.task, getCurrentMonth()));
    }
  }

  function renderBody() {
    if (query.isPending) {
      return (
        <div role="status" aria-label="Loading notifications" className="space-y-2 p-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      );
    }

    if (query.isError || !data) {
      return (
        <p className="p-4 text-sm text-muted-foreground">
          Couldn't load notifications.{" "}
          <button
            type="button"
            onClick={() => query.refetch()}
            className="underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      );
    }

    if (data.items.length === 0) {
      return (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-medium">You're all caught up</p>
          <p className="mt-1 text-xs text-muted-foreground">
            New activity on your cards shows up here.
          </p>
        </div>
      );
    }

    return (
      <>
        <ul className="space-y-0.5 p-1.5">
          {data.items.map((notification) => (
            <li key={notification.id}>
              <NotificationItem notification={notification} onOpen={handleOpen} />
            </li>
          ))}
        </ul>

        {data.total > data.items.length && (
          <p className="px-4 pb-3 text-center text-xs text-muted-foreground">
            Showing the latest {data.items.length} of {data.total}
          </p>
        )}
      </>
    );
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      tabIndex={-1}
      style={position}
      className="glass-popover fixed z-40 flex max-h-[min(32rem,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-3xl outline-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <Button
          variant="ghost"
          className="h-8 px-3 text-xs"
          disabled={!data || data.unread_count === 0}
          onClick={() => markAllRead.mutate()}
        >
          Mark all as read
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">{renderBody()}</div>
    </div>,
    document.body,
  );
}
