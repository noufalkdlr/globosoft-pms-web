import { useSearchParams } from "react-router";

import { getCurrentMonth, isValidMonth } from "../../../utils/month";
import type { DesignerFilter } from "../lib/boardFilters";

// Reads which month, client and designer the board shows from the URL
// (?month=2026-11&client=3&designer=11, or designer=unassigned). Anything
// missing or invalid falls back to the current month and everyone instead of
// breaking the page.
export function useBoardParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawMonth = searchParams.get("month");
  const month = rawMonth && isValidMonth(rawMonth) ? rawMonth : getCurrentMonth();

  const rawClient = searchParams.get("client");
  const clientId = rawClient && /^\d+$/.test(rawClient) ? Number(rawClient) : null;

  const rawDesigner = searchParams.get("designer");
  const designer: DesignerFilter =
    rawDesigner === "unassigned"
      ? "unassigned"
      : rawDesigner && /^\d+$/.test(rawDesigner)
        ? Number(rawDesigner)
        : null;

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

  // null shows every designer's cards
  function setDesigner(nextDesigner: DesignerFilter) {
    const next = new URLSearchParams(searchParams);

    if (nextDesigner === null) {
      next.delete("designer");
    } else {
      next.set("designer", String(nextDesigner));
    }

    setSearchParams(next);
  }

  // Both at once: two separate calls would each start from the same old URL
  function clearFilters() {
    const next = new URLSearchParams(searchParams);
    next.delete("client");
    next.delete("designer");
    setSearchParams(next);
  }

  return {
    month,
    clientId,
    designer,
    setMonth,
    setClientId,
    setDesigner,
    clearFilters,
  };
}
