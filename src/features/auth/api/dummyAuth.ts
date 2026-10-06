import { DEMO_DATA_MODE } from "../../../config/demoData";
import { findAccountByEmail } from "../../users/api/dummyUsers";

import type { AuthUser } from "../types/authTypes";

// TEMPORARY: simulates the sign-in side of the FastAPI auth backend so the UI
// can be built and demoed first. Delete this file once the real API is
// connected.
//
// Who may sign in is decided by the users table (features/users/api/dummyUsers):
// an admin adds people there, from the Users screen.

// The session lives in dummySession.ts; it is re-exported so older imports of
// these functions from this file keep working
export { clearSession, readSession, writeSession } from "./dummySession";

// The accounts offered by the demo "Choose an account" screen. Anyone else an
// admin adds can sign in with "Use another account" by typing their address.
export const DEMO_ACCOUNTS: Array<Pick<AuthUser, "id" | "name" | "email">> =
  DEMO_DATA_MODE === "empty"
    ? [
        { id: 1, name: "George", email: "george@globosoft.example" },
        { id: 2, name: "Ramseena", email: "ramseena@globosoft.example" },
        { id: 4, name: "Deepak", email: "deepak@globosoft.example" },
        { id: 3, name: "Noufal", email: "noufal@globosoft.example" },
      ]
    : [
        { id: 1, name: "Admin Demo", email: "admin.demo@gmail.com" },
        { id: 2, name: "Marketing Demo", email: "marketing.demo@gmail.com" },
        { id: 3, name: "Designer Demo", email: "designer.demo@gmail.com" },
      ];

// The result of looking a Google account up in the users table:
// - "unknown": never added by an admin
// - "inactive": added, then deactivated
// - "ok": may sign in
export type AccountLookup =
  | { status: "unknown" }
  | { status: "inactive" }
  | { status: "ok"; user: AuthUser };

// In the real flow the backend first verifies the Google token, then does this
// lookup against the users table (and checks is_active).
export function lookupAccount(email: string): AccountLookup {
  const found = findAccountByEmail(email);

  if (!found) {
    return { status: "unknown" };
  }

  return found.isActive ? { status: "ok", user: found.user } : { status: "inactive" };
}
