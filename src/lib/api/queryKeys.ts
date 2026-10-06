import type { ClientListParams } from "../../features/clients/types/clientTypes";

// All TanStack Query keys in one place. A mutation invalidates the broad key
// (e.g. queryKeys.clients.all) and every list or detail under it refetches.
export const queryKeys = {
  clients: {
    all: ["clients"] as const,
    list: (params: ClientListParams) => ["clients", "list", params] as const,
  },
  contentTypes: {
    all: ["content-types"] as const,
  },
};
