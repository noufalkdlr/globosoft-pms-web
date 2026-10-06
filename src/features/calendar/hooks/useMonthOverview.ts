import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { getMonthOverviewApi } from "../api/overviewApi";

// Deliberately does not keep the previous month's data while a new month
// loads: the page would show last month's numbers under this month's name.
export function useMonthOverview(month: string) {
  return useQuery({
    queryKey: queryKeys.clients.overview(month),
    queryFn: () => getMonthOverviewApi(month),
  });
}
