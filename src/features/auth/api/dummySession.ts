import type { AuthUser } from "../types/authTypes";

// TEMPORARY: the dummy "session" lives in localStorage so a page reload keeps
// the user logged in, like the real cookie-based session will.
const SESSION_KEY = "pms-dummy-session";

export function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function writeSession(user: AuthUser) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable: the session just will not survive a reload
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear if storage is unavailable
  }
}
