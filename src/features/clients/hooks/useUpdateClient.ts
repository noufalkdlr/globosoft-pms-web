import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { updateClientApi } from "../api/clientsApi";

import type { Client, ClientUpdateRequest } from "../types/clientTypes";

interface UpdateClientVariables {
  id: number;
  data: ClientUpdateRequest;
}

// Used for editing, archiving and restoring: the backend has no delete
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation<Client, Error, UpdateClientVariables>({
    mutationFn: ({ id, data }) => updateClientApi(id, data),
    onSuccess: (client, { data }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });

      if (data.is_archived === true) {
        toast.success(`${client.name} archived`);
      } else if (data.is_archived === false) {
        toast.success(`${client.name} restored`);
      } else {
        toast.success(`${client.name} updated`);
      }
    },
  });
}
