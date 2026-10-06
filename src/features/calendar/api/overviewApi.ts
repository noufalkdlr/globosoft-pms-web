import { wait } from "../../../lib/api/dummyHelpers";
import { computeMonthOverview } from "../../tasks/api/dummyTasks";

import type { ClientMonthOverview } from "../types/overviewTypes";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace the body
// with the call below. computeMonthOverview lives in dummyTasks.ts and goes
// away with it: the backend computes these numbers.

// const response = await api.get<ClientMonthOverview[]>(CLIENT_ENDPOINTS.overview, { params: { month } });
// return response.data;
export async function getMonthOverviewApi(
  month: string,
): Promise<ClientMonthOverview[]> {
  await wait(400);

  return computeMonthOverview(month);
}
