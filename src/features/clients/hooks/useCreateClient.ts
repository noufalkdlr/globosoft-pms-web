import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { createClientApi } from "../api/clientsApi";

import type { Client, ClientCreateRequest } from "../types/clientTypes";

// Errors are not toasted here: the form shows them next to the right field
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation<Client, Error, ClientCreateRequest>({
    mutationFn: createClientApi,
    onSuccess: (client) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      toast.success(`${client.name} added`);
    },
  });
}
