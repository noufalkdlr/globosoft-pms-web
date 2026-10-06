import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { createTaskApi } from "../api/tasksApi";

import type { Task, TaskCreateRequest } from "../types/taskTypes";

// No toast here: writers add many cards in a row, and the new card appearing
// in the list is the confirmation. The form shows errors next to the field.
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, TaskCreateRequest>({
    mutationFn: createTaskApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      // The month overview counts cards, so it changes too
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.overviewAll,
      });
    },
  });
}
