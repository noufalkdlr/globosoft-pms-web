import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { getErrorMessage } from "../../../lib/api/errors";
import { queryKeys } from "../../../lib/api/queryKeys";
import { useAuthStore } from "../../../stores/authStore";
import { toast } from "../../../stores/toastStore";
import { cropToSquare } from "../../../utils/image";
import { removeMyAvatarApi, setMyAvatarApi } from "../api/usersApi";

import type { AuthUser } from "../../auth/types/authTypes";

// A picture the app itself refuses (wrong type, unreadable) is a plain Error
// with words meant for the person; a refusal from the server is an axios error
function messageOf(error: Error) {
  return isAxiosError(error) ? getErrorMessage(error) : error.message;
}

// The person's picture changes everywhere they appear: the header, the Users
// list, the "Assign to" list and the cards they hold.
function useAfterAvatarChange() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return (user: AuthUser, message: string) => {
    setUser(user);
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    toast.success(message);
  };
}

// Takes the file the person chose: crops it to a square, then uploads it
export function useChangeMyAvatar() {
  const afterChange = useAfterAvatarChange();

  return useMutation<AuthUser, Error, File>({
    mutationFn: async (file) => setMyAvatarApi(await cropToSquare(file)),
    onSuccess: (user) => afterChange(user, "Photo updated"),
    onError: (error) => toast.error(messageOf(error)),
  });
}

export function useRemoveMyAvatar() {
  const afterChange = useAfterAvatarChange();

  return useMutation<AuthUser, Error, void>({
    mutationFn: removeMyAvatarApi,
    onSuccess: (user) => afterChange(user, "Photo removed"),
    onError: (error) => toast.error(messageOf(error)),
  });
}
