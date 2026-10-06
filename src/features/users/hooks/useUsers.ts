import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listUsersApi } from "../api/usersApi";

import type { UserListParams } from "../types/userTypes";

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => listUsersApi(params),
    // Keep showing the previous list while a new search is loading
    placeholderData: keepPreviousData,
  });
}
