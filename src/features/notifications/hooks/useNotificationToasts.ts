import { useEffect, useRef } from "react";

import { toast } from "../../../stores/toastStore";

import type { NotificationRecord } from "../types/notificationTypes";

// How many new lines get their own pop-up at once. A burst of more than this
// would bury the screen, and the bell has them all anyway.
const MAX_TOASTS_AT_ONCE = 3;

// A small pop-up for each notification that arrives while the app is open.
// What was already there when the app opened stays quiet (the bell's number
// says so); only what arrives afterwards is announced.
export function useNotificationToasts(items: NotificationRecord[] | undefined) {
  // The highest id seen so far. null until the first list has arrived.
  const seenUpTo = useRef<number | null>(null);

  useEffect(() => {
    if (!items) {
      return;
    }

    const newest = items.reduce((max, item) => Math.max(max, item.id), 0);

    if (seenUpTo.current === null) {
      seenUpTo.current = newest;
      return;
    }

    const fresh = items
      .filter((item) => item.id > (seenUpTo.current ?? 0) && !item.is_read)
      .sort((a, b) => a.id - b.id);

    seenUpTo.current = Math.max(seenUpTo.current, newest);

    fresh.slice(-MAX_TOASTS_AT_ONCE).forEach((item) => toast.info(item.message));
  }, [items]);
}
