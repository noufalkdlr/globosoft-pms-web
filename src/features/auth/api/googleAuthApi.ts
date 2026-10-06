import type { GoogleLoginRequest, LoginResponse } from "../types/authTypes";
import {
  fakeApiError,
  resolveDummyUser,
  wait,
  writeSession,
} from "./dummyAuth";

// DUMMY IMPLEMENTATION. In the dummy flow `credential` is simply the chosen
// account's email. When the FastAPI backend is ready, replace the body with:
//
//   const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.google, payload);
//   return response.data;
export async function googleAuthApi(
  payload: GoogleLoginRequest,
): Promise<LoginResponse> {
  await wait(700);

  const user = resolveDummyUser(payload.credential);

  if (!user) {
    throw fakeApiError(
      403,
      "Your account hasn't been added yet. Ask an admin to add you.",
    );
  }

  writeSession(user);

  return { user };
}
