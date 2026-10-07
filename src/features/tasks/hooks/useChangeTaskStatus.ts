import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { changeTaskStatusApi } from "../api/tasksApi";

import type { PaginatedResponse } from "../../../types/paginationTypes";
import type {
  Task,
  TaskStatus,
  TaskStatusChangeRequest,
} from "../types/taskTypes";

interface ChangeStatusVariables {
  id: number;
  data: TaskStatusChangeRequest;
}

type TaskPage = PaginatedResponse<Task>;

const SUCCESS_MESSAGE: Record<TaskStatus, string> = {
  todo: "Card moved to To do",
  ongoing: "Moved to Ongoing",
  submitted: "Submitted for approval",
  fix: "Sent back for correction",
  done: "Approved",
};

// Replaces one card inside every cached card list
function updateTaskInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  id: number,
  change: (task: Task) => Task,
) {
  queryClient.setQueriesData<TaskPage>(
    { queryKey: queryKeys.tasks.all },
    (page) =>
      page
        ? {
            ...page,
            items: page.items.map((task) =>
              task.id === id ? change(task) : task,
            ),
          }
        : page,
  );
}

// Moves a card along the board. The card jumps to its new column at once
// (optimistic update) and jumps back if the server refuses. Errors are not
// toasted here: a dialog shows them inline, and a drag and drop toasts them.
export function useChangeTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Task,
    Error,
    ChangeStatusVariables,
    { snapshots: Array<[readonly unknown[], TaskPage | undefined]> }
  >({
    mutationFn: ({ id, data }) => changeTaskStatusApi(id, data),

    onMutate: async ({ id, data }) => {
      // A refetch finishing now would overwrite the optimistic change
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      const snapshots = queryClient.getQueriesData<TaskPage>({
        queryKey: queryKeys.tasks.all,
      });

      updateTaskInLists(queryClient, id, (task) => ({
        ...task,
        status: data.status,
        file_link: data.file_link ? data.file_link.trim() : task.file_link,
      }));

      return { snapshots };
    },

    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, snapshot]) => {
        queryClient.setQueryData(key, snapshot);
      });
    },

    onSuccess: (task, { data }) => {
      // Swap the guess for what the server really saved (new updated_at, review)
      updateTaskInLists(queryClient, task.id, () => task);
      toast.success(SUCCESS_MESSAGE[data.status]);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      // "Done" cards are counted in the month overview
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.overviewAll,
      });
    },
  });
}
