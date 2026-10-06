import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { ROUTES } from "../../../lib/routes";
import { useAuthStore } from "../../../stores/authStore";
import { logoutApi } from "../api/logoutApi";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resetAuth = useAuthStore((state) => state.resetAuth);

  return useMutation({
    mutationFn: logoutApi,
    // onSettled (not onSuccess): even if the server call fails, the user must
    // never stay logged in on this device
    onSettled: () => {
      resetAuth();
      // Drop cached data so the next user never sees the previous user's data
      queryClient.clear();
      navigate(ROUTES.login, { replace: true });
    },
  });
}
