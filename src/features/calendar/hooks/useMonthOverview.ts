import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { getMonthOverviewApi } from "../api/overviewApi";

export function useMonthOverview(month: string) {
  return useQuery({
    queryKey: queryKeys.clients.overview(month),
    queryFn: () => getMonthOverviewApi(month),
    // Switching months keeps the previous numbers on screen until the new ones arrive
    placeholderData: keepPreviousData,
  });
}
