import { AxiosError, type InternalAxiosRequestConfig } from "axios";

// TEMPORARY helpers shared by the dummy API files, which stand in for the
// FastAPI backend until it exists. Delete together with the dummy files.

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Builds the same error object axios throws for a real HTTP error response,
// with FastAPI's { detail } body, so error handling code behaves identically
// with dummy data and with the real backend.
export function fakeApiError(status: number, detail: string) {
  const config = { headers: {} } as InternalAxiosRequestConfig;

  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_REQUEST,
    config,
    null,
    { data: { detail }, status, statusText: "", headers: {}, config },
  );
}
