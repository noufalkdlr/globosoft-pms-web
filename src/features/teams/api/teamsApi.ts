import { wait } from "../../../lib/api/dummyHelpers";
import { listTeams } from "./dummyTeams";

import type { Team } from "../../auth/types/authTypes";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace the body
// with the call below and delete dummyTeams.ts.

// const response = await api.get<Team[]>(TEAM_ENDPOINTS.list);
// return response.data;
export async function listTeamsApi(): Promise<Team[]> {
  await wait(200);

  return listTeams();
}
