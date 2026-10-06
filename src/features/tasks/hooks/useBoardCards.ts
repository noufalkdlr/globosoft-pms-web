import { useTasks } from "./useTasks";

// The most cards one board request returns (the API's cap for /tasks)
export const BOARD_CARD_LIMIT = 500;

// Every card the board shows for a month: the month's own cards plus unfinished
// work carried over from earlier months, optionally for one client. A person
// who is not a manager only gets the cards that are theirs (the backend decides).
export function useBoardCards(month: string, clientId: number | null) {
  return useTasks({
    month,
    client_id: clientId ?? undefined,
    include_late: true,
    limit: BOARD_CARD_LIMIT,
  });
}
