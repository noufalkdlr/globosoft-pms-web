import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { getHomeRoute } from "../../../lib/routes";
import { useAuthStore } from "../../../stores/authStore";
import { googleAuthApi } from "../api/googleAuthApi";

import type { GoogleLoginRequest, LoginResponse } from "../types/authTypes";

export function useGoogleAuth() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation<LoginResponse, Error, GoogleLoginRequest>({
    mutationFn: googleAuthApi,
    onSuccess: ({ user }) => {
      setUser(user);
      navigate(getHomeRoute(user), { replace: true });
    },
  });
}
