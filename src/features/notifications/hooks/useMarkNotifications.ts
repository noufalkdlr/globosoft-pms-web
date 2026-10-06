import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import {
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../api/notificationsApi";

import type { NotificationList } from "../types/notificationTypes";

type Snapshots = Array<[readonly unknown[], NotificationList | undefined]>;

// Both actions update the bell at once (the dot and the number go away before
// the server answers) and put it back if the server refuses.
function useBellUpdate<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  change: (list: NotificationList, variables: TVariables) => NotificationList,
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TVariables, { snapshots: Snapshots }>({
    mutationFn,

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const snapshots = queryClient.getQueriesData<NotificationList>({
        queryKey: queryKeys.notifications.all,
      });

      queryClient.setQueriesData<NotificationList>(
        { queryKey: queryKeys.notifications.all },
        (list) => (list ? change(list, variables) : list),
      );

      return { snapshots };
    },

    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, snapshot]) => {
        queryClient.setQueryData(key, snapshot);
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkNotificationRead() {
  return useBellUpdate<number>(markNotificationReadApi, (list, id) => {
    const wasUnread = list.items.some((item) => item.id === id && !item.is_read);

    return {
      ...list,
      unread_count: Math.max(0, list.unread_count - (wasUnread ? 1 : 0)),
      items: list.items.map((item) =>
        item.id === id ? { ...item, is_read: true } : item,
      ),
    };
  });
}

export function useMarkAllNotificationsRead() {
  return useBellUpdate<void>(markAllNotificationsReadApi, (list) => ({
    ...list,
    unread_count: 0,
    items: list.items.map((item) => ({ ...item, is_read: true })),
  }));
}
