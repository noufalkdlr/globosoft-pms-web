import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { updateTaskApi } from "../api/tasksApi";

import type { Task, TaskUpdateRequest } from "../types/taskTypes";

interface UpdateTaskVariables {
  id: number;
  data: TaskUpdateRequest;
}

// Used for editing a card and for assigning or unassigning it
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, UpdateTaskVariables>({
    mutationFn: ({ id, data }) => updateTaskApi(id, data),
    onSuccess: (task, { data }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.overviewAll,
      });

      if (data.assigned_to !== undefined && task.assigned_to) {
        toast.success(`Assigned to ${task.assigned_to.name}`);
      } else if (data.assigned_to === null) {
        toast.success("Designer removed from the card");
      } else {
        toast.success("Card updated");
      }
    },
    // The dialog shows the error. If the card was changed by someone else, the
    // lists must show the new version when the person tries again.
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}
