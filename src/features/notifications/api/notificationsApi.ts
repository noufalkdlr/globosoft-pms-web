import { wait } from "../../../lib/api/dummyHelpers";
import { listNotifications, markAllRead, markRead } from "./dummyNotifications";

import type {
  NotificationList,
  NotificationListParams,
  NotificationRecord,
} from "../types/notificationTypes";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace each body
// with the call in its comment and delete dummyNotifications.ts.

// const response = await api.get<NotificationList>(NOTIFICATION_ENDPOINTS.list, { params });
// return response.data;
export async function listNotificationsApi(
  params: NotificationListParams,
): Promise<NotificationList> {
  await wait(200);

  return listNotifications(params);
}

// const response = await api.patch<NotificationRecord>(NOTIFICATION_ENDPOINTS.markRead(id));
// return response.data;
export async function markNotificationReadApi(id: number): Promise<NotificationRecord> {
  await wait(150);

  return markRead(id);
}

// await api.post(NOTIFICATION_ENDPOINTS.readAll);
export async function markAllNotificationsReadApi(): Promise<void> {
  await wait(150);

  markAllRead();
}
