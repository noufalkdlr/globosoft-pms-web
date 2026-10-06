import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listTasksApi } from "../api/tasksApi";

import type { TaskListParams } from "../types/taskTypes";

// Cards belong to one specific month, client or status, so the previous
// result is not kept while another one loads: it would show the wrong cards
// under the new heading.
export function useTasks(params: TaskListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => listTasksApi(params),
    enabled,
  });
}
