import { clearSession, wait } from "./dummyAuth";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace the body with:
//
//   await api.post(AUTH_ENDPOINTS.logout);
export async function logoutApi(): Promise<void> {
  await wait(200);
  clearSession();
}
