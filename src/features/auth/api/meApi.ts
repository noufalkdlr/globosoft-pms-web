import type { AuthUser } from "../types/authTypes";
import { fakeApiError, wait } from "../../../lib/api/dummyHelpers";
import { findActiveUser } from "../../users/api/dummyUsers";
import { clearSession, readSession, writeSession } from "./dummySession";

// DUMMY IMPLEMENTATION. Used on app start to restore an existing session.
// When the FastAPI backend is ready, replace the body with:
//
//   const response = await api.get<AuthUser>(AUTH_ENDPOINTS.me);
//   return response.data;
//
// It returns the person as saved now (not the copy kept at sign-in), so a role
// or team change by an admin takes effect on the next load, and a deactivated
// person is signed out.
export async function meApi(): Promise<AuthUser> {
  await wait(300);

  const session = readSession();

  if (!session) {
    throw fakeApiError(401, "Not authenticated");
  }

  const user = findActiveUser(session.id);

  if (!user) {
    clearSession();
    throw fakeApiError(401, "Not authenticated");
  }

  writeSession(user);

  return user;
}
