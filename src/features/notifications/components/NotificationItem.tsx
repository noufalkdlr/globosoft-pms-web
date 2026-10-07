import {
  CircleCheck,
  MessageSquareWarning,
  Pencil,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "../../../utils/cn";
import { formatRelativeTime } from "../lib/formatRelativeTime";

import type { NotificationRecord, NotificationType } from "../types/notificationTypes";

const ICON: Record<NotificationType, LucideIcon> = {
  assigned: UserPlus,
  unassigned: UserMinus,
  updated: Pencil,
  deleted: Trash2,
  submitted: Send,
  approved: CircleCheck,
  sent_back: MessageSquareWarning,
};

// Good news is green, a card sent back is orange, everything else is neutral
const ICON_CLASS: Partial<Record<NotificationType, string>> = {
  approved: "text-success",
  sent_back: "text-caution",
};

interface NotificationItemProps {
  notification: NotificationRecord;
  onOpen: (notification: NotificationRecord) => void;
}

export function NotificationItem({ notification, onOpen }: NotificationItemProps) {
  const Icon = ICON[notification.type];

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/5",
        !notification.is_read && "bg-white/[0.04]",
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", ICON_CLASS[notification.type] ?? "text-muted-foreground")}
        aria-hidden="true"
      />

      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug">
          {!notification.is_read && <span className="sr-only">Unread: </span>}
          {notification.message}
        </span>
        <time dateTime={notification.created_at} className="mt-0.5 block text-xs text-muted-foreground">
          {formatRelativeTime(notification.created_at)}
        </time>
      </span>

      {!notification.is_read && (
        <span
          aria-hidden="true"
          className="mt-1.5 size-2 shrink-0 rounded-full bg-brand shadow-brand-glow"
        />
      )}
    </button>
  );
}
