import { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type { AuthUser, Team } from "../types/authTypes";

// TEMPORARY: simulates the FastAPI auth backend so the UI can be built and
// demoed first. Delete this file once the real API is connected.
//
// Only the accounts in DEMO_ACCOUNTS are "added by an admin". Any other
// Google account gets the same 403 the real backend will return.

const SESSION_KEY = "pms-dummy-session";

const TEAMS = {
  marketing: {
    id: 1,
    name: "Marketing",
    can_manage_clients: true,
    can_create_content: true,
    can_assign: true,
    can_review: true,
  },
  design: {
    id: 2,
    name: "Design",
    can_manage_clients: false,
    can_create_content: false,
    can_assign: false,
    can_review: false,
  },
} satisfies Record<string, Team>;

// Shown in the demo account chooser
export const DEMO_ACCOUNTS: AuthUser[] = [
  {
    id: 1,
    name: "Admin Demo",
    email: "admin.demo@gmail.com",
    role: "admin",
    team: null,
  },
  {
    id: 2,
    name: "Marketing Demo",
    email: "marketing.demo@gmail.com",
    role: "member",
    team: TEAMS.marketing,
  },
  {
    id: 3,
    name: "Designer Demo",
    email: "designer.demo@gmail.com",
    role: "member",
    team: TEAMS.design,
  },
];

// An account that exists on Google but was never added by an admin
export const NOT_ADDED_EMAIL = "someone.else@gmail.com";

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

// Same rule the backend must apply: Gmail ignores case, dots and "+tag" parts,
// so "Noufal.Globosoft@gmail.com" and "noufalglobosoft@gmail.com" are one
// account and must match the same row.
function normalizeEmail(email: string) {
  const [localPart, domain] = email.trim().toLowerCase().split("@");

  if (domain === "gmail.com") {
    return `${localPart.split("+")[0].replaceAll(".", "")}@gmail.com`;
  }

  return `${localPart}@${domain}`;
}

// Returns undefined for an account that was not added by an admin.
// In the real flow the backend first verifies the Google token, then does
// this lookup against the users table (and checks is_active).
export function resolveDummyUser(email: string): AuthUser | undefined {
  const normalized = normalizeEmail(email);

  return DEMO_ACCOUNTS.find(
    (account) => normalizeEmail(account.email) === normalized,
  );
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
