import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { toast } from "../../../stores/toastStore";
import { updateUserApi } from "../api/usersApi";

import type { UserRecord, UserUpdateRequest } from "../types/userTypes";

interface UpdateUserVariables {
  id: number;
  data: UserUpdateRequest;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<UserRecord, Error, UpdateUserVariables>({
    mutationFn: ({ id, data }) => updateUserApi(id, data),
    onSuccess: (user, { data }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

      if (data.is_active === false) {
        toast.success(`${user.name} deactivated`);
      } else if (data.is_active === true) {
        toast.success(`${user.name} reactivated`);
      } else {
        toast.success("Changes saved");
      }
    },
  });
}
