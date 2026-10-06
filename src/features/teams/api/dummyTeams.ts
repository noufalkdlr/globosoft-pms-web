import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { readSession } from "../../auth/api/dummySession";

import type { Team } from "../../auth/types/authTypes";

// TEMPORARY: stands in for the teams table of the FastAPI backend. The
// permission flags are seed data for now: there is no screen to change them.
// Delete this file once the real API is connected.

export const TEAMS = {
  marketing: {
    id: 1,
    name: "Marketing",
    can_manage_clients: true,
    can_create_content: true,
    can_assign: true,
    can_review: true,
    can_receive_tasks: false,
  },
  design: {
    id: 2,
    name: "Design",
    can_manage_clients: false,
    can_create_content: false,
    can_assign: false,
    can_review: false,
    can_receive_tasks: true,
  },
} satisfies Record<string, Team>;

export function findTeam(id: number): Team | undefined {
  return Object.values(TEAMS).find((team) => team.id === id);
}

// Admins only: the Users screen needs the list for its Team dropdown
export function listTeams(): Team[] {
  const user = readSession();

  if (!user) {
    throw fakeApiError(401, "Not authenticated");
  }

  if (user.role !== "admin") {
    throw fakeApiError(403, "Only admins can see the teams.");
  }

  return Object.values(TEAMS);
}
