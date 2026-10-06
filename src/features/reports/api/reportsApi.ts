import { wait } from "../../../lib/api/dummyHelpers";
import { getReportSummary } from "./dummyReports";

import type { ReportParams, ReportSummary } from "../types/reportTypes";

// DUMMY IMPLEMENTATION. When the FastAPI backend is ready, replace the body
// with the call below and delete dummyReports.ts.

// const response = await api.get<ReportSummary>(REPORT_ENDPOINTS.summary, { params });
// return response.data;
export async function getReportSummaryApi(
  params: ReportParams,
): Promise<ReportSummary> {
  await wait(450);

  return getReportSummary(params);
}
