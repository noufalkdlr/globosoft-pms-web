import { can } from "../../../lib/permissions";
import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { DEMO_ACCOUNTS, TEAMS, readSession } from "../../auth/api/dummyAuth";

import type { AuthUser } from "../../auth/types/authTypes";
import type { AssignableUser } from "../types/userTypes";

// TEMPORARY: stands in for the users table of the FastAPI backend.
// Delete this file once the real API is connected.

// Extra Design team members. They are not demo login accounts, they exist so
// the "Assign to" dropdown has several names.
const EXTRA_DESIGNERS: AuthUser[] = [
  {
    id: 11,
    name: "Anu Mathew",
    email: "anu.mathew@gmail.com",
    role: "member",
    team: TEAMS.design,
  },
  {
    id: 12,
    name: "Rahul Krishnan",
    email: "rahul.krishnan@gmail.com",
    role: "member",
    team: TEAMS.design,
  },
  {
    id: 13,
    name: "Meera Joseph",
    email: "meera.joseph@gmail.com",
    role: "member",
    team: TEAMS.design,
  },
];

const DIRECTORY: AuthUser[] = [...DEMO_ACCOUNTS, ...EXTRA_DESIGNERS];

export function findUser(id: number): AuthUser | undefined {
  return DIRECTORY.find((user) => user.id === id);
}

function toAssignable(user: AuthUser): AssignableUser | null {
  return user.team?.can_receive_tasks
    ? { id: user.id, name: user.name, team: { id: user.team.id, name: user.team.name } }
    : null;
}

// Used by the tasks dummy to validate an assignee
export function findAssignableUser(id: number): AssignableUser | undefined {
  const user = findUser(id);

  return user ? (toAssignable(user) ?? undefined) : undefined;
}

export function listAssignableUsers(): AssignableUser[] {
  const user = readSession();

  if (!user) {
    throw fakeApiError(401, "Not authenticated");
  }

  if (!can(user, "can_assign")) {
    throw fakeApiError(403, "You don't have permission to assign cards.");
  }

  return DIRECTORY.map(toAssignable)
    .filter((item): item is AssignableUser => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}
