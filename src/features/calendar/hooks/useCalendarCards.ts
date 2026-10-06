import { useTasks } from "../../tasks/hooks/useTasks";

// The most cards the API returns per request. A client has far fewer in a month.
export const CALENDAR_CARD_LIMIT = 100;

// The cards of one client for one month. Called by the page itself (not by the
// client panel), so the request starts together with the month overview
// instead of waiting for it.
export function useCalendarCards(month: string, clientId: number | null) {
  return useTasks(
    {
      month,
      client_id: clientId ?? undefined,
      limit: CALENDAR_CARD_LIMIT,
    },
    clientId !== null,
  );
}
