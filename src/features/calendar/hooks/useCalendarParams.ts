import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { getDefaultCalendarMonth, isValidMonth } from "../../../utils/month";

// Reads which month and client the calendar shows from the URL
// (?month=2026-11&client=3). Anything missing or invalid falls back to a
// sensible default instead of breaking the page.
export function useCalendarParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Decided once per visit, so the page does not jump at midnight
  const defaultMonth = useMemo(() => getDefaultCalendarMonth(), []);

  const rawMonth = searchParams.get("month");
  const month = rawMonth && isValidMonth(rawMonth) ? rawMonth : defaultMonth;

  const rawClient = searchParams.get("client");
  const clientId = rawClient && /^\d+$/.test(rawClient) ? Number(rawClient) : null;

  function setMonth(nextMonth: string) {
    const next = new URLSearchParams(searchParams);
    next.set("month", nextMonth);
    setSearchParams(next);
  }

  // null selects the overview
  function selectClient(nextClientId: number | null) {
    const next = new URLSearchParams(searchParams);
    next.set("month", month);

    if (nextClientId === null) {
      next.delete("client");
    } else {
      next.set("client", String(nextClientId));
    }

    setSearchParams(next);
  }

  return { month, clientId, setMonth, selectClient };
}
