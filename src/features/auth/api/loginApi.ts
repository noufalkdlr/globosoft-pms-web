import type { LoginRequest, LoginResponse } from "../types/authTypes";
import {
  fakeApiError,
  resolveDummyUser,
  wait,
  writeSession,
} from "./dummyAuth";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace the body with:
//
//   const response = await api.post<LoginResponse>(AUTH_ENDPOINTS.login, payload);
//   return response.data;
export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  await wait(600);

  if (payload.password === "wrong") {
    throw fakeApiError(401, "Incorrect email or password");
  }

  const user = resolveDummyUser(payload.email);
  writeSession(user);

  return { user };
}
