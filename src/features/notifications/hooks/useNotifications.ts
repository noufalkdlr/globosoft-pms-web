import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listNotificationsApi } from "../api/notificationsApi";

import type { NotificationListParams } from "../types/notificationTypes";

// How often the bell asks for news. There is no push yet (that comes with the
// PWA), so the app simply asks again every half minute.
export const NOTIFICATION_POLL_MS = 30_000;

// What the bell shows: the latest few, plus the unread total
export const BELL_PARAMS: NotificationListParams = { limit: 20 };

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(BELL_PARAMS),
    queryFn: () => listNotificationsApi(BELL_PARAMS),
    // The app's other data is kept for a minute, which would make a bell that
    // ignores you coming back to the tab. News must be checked at once.
    staleTime: 0,
    refetchInterval: NOTIFICATION_POLL_MS,
    // A hidden tab does not need to keep asking; it refreshes when it is shown again
    refetchIntervalInBackground: false,
  });
}
