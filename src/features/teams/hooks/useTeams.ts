import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listTeamsApi } from "../api/teamsApi";

// Teams change almost never (their permissions are seed data), so they are
// kept for a long time instead of being fetched again on every visit
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: listTeamsApi,
    staleTime: 1000 * 60 * 30,
  });
}
