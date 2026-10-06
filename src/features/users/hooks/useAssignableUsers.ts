import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listAssignableUsersApi } from "../api/usersApi";

// Only needed by people who can assign cards; pass enabled=false for everyone
// else so no request is made (the backend would answer 403)
export function useAssignableUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.assignable,
    queryFn: listAssignableUsersApi,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}
