import { isAxiosError } from "axios";

// Turns any thrown value into a message that is safe to show to the user.
// FastAPI error bodies look like { detail: "message" } for HTTPException,
// or { detail: [{ loc, msg, type }] } for request validation errors.
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAxiosError(error)) {
    // No response at all means the server could not be reached
    if (!error.response) {
      return "Cannot reach the server. Check your connection.";
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
      return detail[0].msg;
    }
  }

  return fallback;
}
