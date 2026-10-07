import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

type ToastState = {
  toasts: ToastItem[];
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

// How long a toast stays is decided in ToastHost, where it can also wait while
// the person is reading it.
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: (message, variant = "info") => {
    const id = nextId++;

    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
  },

  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

// Usable anywhere (hooks, mutation callbacks), not only inside components:
//   toast.success("Client added")
export const toast = {
  success: (message: string) =>
    useToastStore.getState().show(message, "success"),
  error: (message: string) => useToastStore.getState().show(message, "error"),
  info: (message: string) => useToastStore.getState().show(message, "info"),
};
