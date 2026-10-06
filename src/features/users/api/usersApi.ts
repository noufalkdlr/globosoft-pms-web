import { wait } from "../../../lib/api/dummyHelpers";
import { listAssignableUsers } from "./dummyUsers";

import type { AssignableUser } from "../types/userTypes";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace the body
// with the call below and delete dummyUsers.ts.

// const response = await api.get<AssignableUser[]>(USER_ENDPOINTS.assignable);
// return response.data;
export async function listAssignableUsersApi(): Promise<AssignableUser[]> {
  await wait(250);

  return listAssignableUsers();
}
