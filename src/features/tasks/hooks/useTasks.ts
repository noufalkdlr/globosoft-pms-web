import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { listTasksApi } from "../api/tasksApi";

import type { TaskListParams } from "../types/taskTypes";

export function useTasks(params: TaskListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => listTasksApi(params),
    enabled,
    // Keep showing the previous cards while another month or client loads,
    // instead of flashing an empty state
    placeholderData: keepPreviousData,
  });
}
