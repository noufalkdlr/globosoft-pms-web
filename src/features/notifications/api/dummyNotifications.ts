import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { readSession } from "../../auth/api/dummySession";
import {
  listNotificationsFor,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../tasks/api/dummyTasks";
import { findActiveUser } from "../../users/api/dummyUsers";

import type {
  NotificationList,
  NotificationListParams,
  NotificationRecord,
} from "../types/notificationTypes";

// TEMPORARY: stands in for the notifications endpoints of the FastAPI backend.
// The lines themselves are written by the code that makes the change (a card
// moved, assigned, deleted): see notify() in the tasks dummy. Delete this file
// once the real API is connected.

const MAX_LIST_LIMIT = 100;

// Everyone sees only their own bell. Like every endpoint, a deactivated person
// is refused at once.
function requireUserId(): number {
  const session = readSession();

  if (!session || !findActiveUser(session.id)) {
    throw fakeApiError(401, "Not authenticated");
  }

  return session.id;
}

export function listNotifications(params: NotificationListParams = {}): NotificationList {
  const userId = requireUserId();
  const { unread = false, limit: requestedLimit = 20, offset = 0 } = params;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIST_LIMIT);

  const all = listNotificationsFor(userId);
  const matches = unread ? all.filter((item) => !item.is_read) : all;

  return {
    items: matches.slice(offset, offset + limit),
    total: matches.length,
    limit,
    offset,
    // Always the whole bell, whatever the page or filter
    unread_count: all.filter((item) => !item.is_read).length,
  };
}

export function markRead(id: number): NotificationRecord {
  const userId = requireUserId();
  const updated = markNotificationRead(userId, id);

  // Someone else's line is "not found", not "forbidden": it is none of their business
  if (!updated) {
    throw fakeApiError(404, "Notification not found.");
  }

  return updated;
}

export function markAllRead(): void {
  markAllNotificationsRead(requireUserId());
}
