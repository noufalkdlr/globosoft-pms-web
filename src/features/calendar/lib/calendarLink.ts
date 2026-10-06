import { ROUTES } from "../../../lib/routes";

// Link to the calendar for a month, optionally with one client selected.
// The month and client live in the URL so a view can be shared, bookmarked
// and reached with the browser's back button.
export function calendarLink(month: string, clientId?: number | null) {
  const params = new URLSearchParams({ month });

  if (clientId !== null && clientId !== undefined) {
    params.set("client", String(clientId));
  }

  return { pathname: ROUTES.calendar, search: `?${params.toString()}` };
}
