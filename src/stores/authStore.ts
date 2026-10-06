import { create } from "zustand";

import type { AuthUser } from "../features/auth/types/authTypes";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setUser: (user: AuthUser) => void;
  setBootstrapping: (value: boolean) => void;
  resetAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  // True until the app has checked whether a session already exists
  isBootstrapping: true,

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  setBootstrapping: (value) => {
    set({ isBootstrapping: value });
  },

  resetAuth: () => {
    set({ user: null, isAuthenticated: false, isBootstrapping: false });
  },
}));
