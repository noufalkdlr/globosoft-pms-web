import { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type { AuthUser, Team } from "../types/authTypes";

// TEMPORARY: simulates the FastAPI auth backend so the UI can be built and
// demoed first. Delete this file once the real API is connected.
//
// Dummy login rules (any non-empty password works; "wrong" simulates a 401):
//   admin...@...   -> admin (lands on the reports dashboard)
//   social...@...  -> Social Media team (can assign + review)
//   content...@... -> Content team (can create content)
//   3d...@...      -> 3D team
//   anything else  -> Design team

const SESSION_KEY = "pms-dummy-session";

const TEAMS = {
  design: {
    id: 1,
    name: "Design",
    can_create_content: false,
    can_assign: false,
    can_review: false,
  },
  threeD: {
    id: 2,
    name: "3D",
    can_create_content: false,
    can_assign: false,
    can_review: false,
  },
  content: {
    id: 3,
    name: "Content",
    can_create_content: true,
    can_assign: false,
    can_review: false,
  },
  social: {
    id: 4,
    name: "Social Media",
    can_create_content: false,
    can_assign: true,
    can_review: true,
  },
} satisfies Record<string, Team>;

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

function toDisplayName(localPart: string) {
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function resolveDummyUser(email: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  const localPart = normalizedEmail.split("@")[0];
  const base = { name: toDisplayName(localPart), email: normalizedEmail };

  if (localPart.startsWith("admin")) {
    return { id: 1, ...base, role: "admin", team: null };
  }

  if (localPart.startsWith("social")) {
    return { id: 2, ...base, role: "member", team: TEAMS.social };
  }

  if (localPart.startsWith("content")) {
    return { id: 3, ...base, role: "member", team: TEAMS.content };
  }

  if (localPart.startsWith("3d")) {
    return { id: 4, ...base, role: "member", team: TEAMS.threeD };
  }

  return { id: 5, ...base, role: "member", team: TEAMS.design };
}

// The dummy "session" lives in localStorage so a page reload keeps the user
// logged in, like the real cookie-based session will.
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
