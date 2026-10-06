import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listClientsApi } from "../api/clientsApi";

import type { ClientListParams } from "../types/clientTypes";

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: queryKeys.clients.list(params),
    queryFn: () => listClientsApi(params),
    // Keep showing the previous list while a new search is loading,
    // instead of flashing an empty or loading state on every keystroke
    placeholderData: keepPreviousData,
  });
}
