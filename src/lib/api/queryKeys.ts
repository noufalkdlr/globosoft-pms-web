import type { ClientListParams } from "../../features/clients/types/clientTypes";
import type { TaskListParams } from "../../features/tasks/types/taskTypes";

// All TanStack Query keys in one place. A mutation invalidates the broad key
// (e.g. queryKeys.clients.all) and every list or detail under it refetches.
export const queryKeys = {
  clients: {
    all: ["clients"] as const,
    list: (params: ClientListParams) => ["clients", "list", params] as const,
    // Every month's overview. Cards change these numbers, so card mutations
    // invalidate this key.
    overviewAll: ["clients", "overview"] as const,
    overview: (month: string) => ["clients", "overview", month] as const,
  },
  contentTypes: {
    all: ["content-types"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (params: TaskListParams) => ["tasks", "list", params] as const,
  },
  users: {
    assignable: ["users", "assignable"] as const,
  },
};
