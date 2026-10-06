import { ROUTES } from "../../../lib/routes";

// The board for a card's month, filtered to its client. Unfinished work from
// earlier months shows on the current month's board, so cards of those months
// link there. Used wherever a card is mentioned outside the board.
export function boardLinkFor(
  card: { month: string; client: { id: number } },
  currentMonth: string,
) {
  const month = card.month > currentMonth ? card.month : currentMonth;

  return { pathname: ROUTES.board, search: `?month=${month}&client=${card.client.id}` };
}
