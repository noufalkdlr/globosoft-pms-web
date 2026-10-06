import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "../config/env";
import { AUTH_ENDPOINTS } from "./api/endpoints";
import { useAuthStore } from "../stores/authStore";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Several requests can hit a 401 at the same moment (e.g. queries refetching
// together on window focus). With refresh token rotation only the first
// refresh call succeeds, so every other one would fail and wrongly log the
// user out. Sharing one in-flight promise guarantees a single refresh call
// per expiry; all other requests wait for it and reuse the result.
let refreshPromise: Promise<void> | null = null;

async function performRefresh(): Promise<void> {
  await axios.post(`${env.apiUrl}${AUTH_ENDPOINTS.refresh}`, null, {
    withCredentials: true,
    headers: {
      Accept: "application/json",
    },
  });
}

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // A 401 from login (wrong password) or from refresh itself must never
    // trigger another refresh, otherwise the real error would be swallowed.
    const isAuthRequest =
      originalRequest?.url === AUTH_ENDPOINTS.login ||
      originalRequest?.url === AUTH_ENDPOINTS.refresh;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;

      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().resetAuth();

      return Promise.reject(refreshError);
    }
  },
);
