import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { createUserApi } from "../api/usersApi";

import type { UserCreateRequest, UserRecord } from "../types/userTypes";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<UserRecord, Error, UserCreateRequest>({
    mutationFn: createUserApi,
    onSuccess: (user) => {
      // The Users list and the "Assign to" dropdowns both read the users table
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success(`${user.name} added. They can now sign in with that Gmail account.`);
    },
  });
}
