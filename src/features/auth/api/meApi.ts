import type { AuthUser } from "../types/authTypes";
import { fakeApiError, wait } from "../../../lib/api/dummyHelpers";
import { readSession } from "./dummyAuth";

// DUMMY IMPLEMENTATION. Used on app start to restore an existing session.
// When the FastAPI backend is ready, replace the body with:
//
//   const response = await api.get<AuthUser>(AUTH_ENDPOINTS.me);
//   return response.data;
export async function meApi(): Promise<AuthUser> {
  await wait(300);

  const user = readSession();

  if (!user) {
    throw fakeApiError(401, "Not authenticated");
  }

  return user;
}
