import { addMonths, getCurrentMonth } from "../../../utils/month";
import { useTasks } from "../../tasks/hooks/useTasks";

// Everything that is still open: the cards of next month plus all unfinished
// work from this month and earlier (`include_late`). Finished cards are not
// needed on Home. Next month is included so a deadline on the 1st still shows
// as "due soon" on the 30th. A designer only gets their own cards.
export function useHomeCards() {
  return useTasks({
    month: addMonths(getCurrentMonth(), 1),
    include_late: true,
    limit: 500,
  });
}
