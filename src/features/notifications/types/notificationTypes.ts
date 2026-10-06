// Mirrors the FastAPI JSON (snake_case)

import type { PaginatedResponse } from "../../../types/paginationTypes";

export type NotificationType =
  | "assigned"
  | "unassigned"
  | "updated"
  | "deleted"
  | "submitted"
  | "approved"
  | "sent_back";

export interface NotificationRecord {
  id: number;
  type: NotificationType;
  // The sentence to show, written by the backend when it happened
  message: string;
  is_read: boolean;
  created_at: string;
  // The card it is about, so the bell can link to it. null when the card was deleted.
  task: { id: number; month: string; client: { id: number; name: string } } | null;
}

// The page of notifications, plus how many are unread in total, so the bell
// can show its number from the same request
export interface NotificationList extends PaginatedResponse<NotificationRecord> {
  unread_count: number;
}

export interface NotificationListParams {
  // Only the unread ones
  unread?: boolean;
  limit?: number;
  offset?: number;
}
