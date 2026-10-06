import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { getHomeRoute } from "../../../lib/routes";
import { useAuthStore } from "../../../stores/authStore";
import { loginApi } from "../api/loginApi";

import type { LoginRequest, LoginResponse } from "../types/authTypes";

export function useLogin() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: loginApi,
    onSuccess: ({ user }) => {
      setUser(user);
      navigate(getHomeRoute(user), { replace: true });
    },
  });
}
