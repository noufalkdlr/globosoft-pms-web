import { useSearchParams } from "react-router";

import { getTodayIst, isValidIsoDate } from "../../../utils/date";
import { getCurrentMonth, isValidMonth } from "../../../utils/month";

import type { ReportParams, ReportPeriod } from "../types/reportTypes";

// Reads what the dashboard shows from the URL
// (?period=day&date=2026-10-06 or ?period=month&month=2026-10), so a report
// can be bookmarked or shared as a link. Anything missing or invalid falls
// back to a sensible default: the monthly report for this month.
export function useReportParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = getTodayIst();

  const period: ReportPeriod = searchParams.get("period") === "day" ? "day" : "month";

  const rawMonth = searchParams.get("month");
  const month = rawMonth && isValidMonth(rawMonth) ? rawMonth : getCurrentMonth();

  // A day that has not happened yet has nothing to report, so it is not offered
  const rawDate = searchParams.get("date");
  const date = rawDate && isValidIsoDate(rawDate) && rawDate <= today ? rawDate : today;

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(changes)) {
      next.set(key, value);
    }

    setSearchParams(next);
  }

  // What to ask the API for
  const params: ReportParams =
    period === "day" ? { period, date } : { period, month };

  return {
    period,
    month,
    date,
    today,
    params,
    setPeriod: (next: ReportPeriod) => update({ period: next }),
    setMonth: (next: string) => update({ period: "month", month: next }),
    setDate: (next: string) => update({ period: "day", date: next }),
  };
}
