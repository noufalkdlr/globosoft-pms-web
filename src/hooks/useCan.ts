import { can, type Permission } from "../lib/permissions";
import { useAuthStore } from "../stores/authStore";

// Component-friendly version of can(): re-renders when the user changes
export function useCan(permission: Permission): boolean {
  const user = useAuthStore((state) => state.user);

  return can(user, permission);
}
