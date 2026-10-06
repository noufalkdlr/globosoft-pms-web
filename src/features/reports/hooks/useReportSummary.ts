import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../../lib/api/queryKeys";
import { getReportSummaryApi } from "../api/reportsApi";

import type { ReportParams } from "../types/reportTypes";

// Not kept while another day or month loads: a report is only useful if the
// numbers match the date shown above them
export function useReportSummary(params: ReportParams) {
  return useQuery({
    queryKey: queryKeys.reports.summary(params),
    queryFn: () => getReportSummaryApi(params),
  });
}
