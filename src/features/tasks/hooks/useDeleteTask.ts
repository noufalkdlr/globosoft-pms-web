import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { deleteTaskApi } from "../api/tasksApi";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: deleteTaskApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      // The month overview counts cards, so it changes too
      void queryClient.invalidateQueries({
        queryKey: queryKeys.clients.overviewAll,
      });
      toast.success("Card deleted");
    },
  });
}
