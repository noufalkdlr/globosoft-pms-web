import { useSearchParams } from "react-router";

import { getCurrentMonth, isValidMonth } from "../../../utils/month";

// Reads which month and client the board shows from the URL
// (?month=2026-11&client=3). Anything missing or invalid falls back to the
// current month and all clients instead of breaking the page.
export function useBoardParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawMonth = searchParams.get("month");
  const month = rawMonth && isValidMonth(rawMonth) ? rawMonth : getCurrentMonth();

  const rawClient = searchParams.get("client");
  const clientId = rawClient && /^\d+$/.test(rawClient) ? Number(rawClient) : null;

  function setMonth(nextMonth: string) {
    const next = new URLSearchParams(searchParams);
    next.set("month", nextMonth);
    setSearchParams(next);
  }

  // null shows every client
  function setClientId(nextClientId: number | null) {
    const next = new URLSearchParams(searchParams);

    if (nextClientId === null) {
      next.delete("client");
    } else {
      next.set("client", String(nextClientId));
    }

    setSearchParams(next);
  }

  return { month, clientId, setMonth, setClientId };
}
