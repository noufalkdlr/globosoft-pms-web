import { useId } from "react";

import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { MonthSwitcher } from "../../../components/ui/MonthSwitcher";
import { PillTabs } from "../../../components/ui/PillTabs";
import { getCurrentMonth } from "../../../utils/month";
import { useReportParams } from "../hooks/useReportParams";
import { useReportSummary } from "../hooks/useReportSummary";
import { DailyReport } from "./DailyReport";
import { DaySwitcher } from "./DaySwitcher";
import { MonthlyReport } from "./MonthlyReport";

import type { ReportPeriod } from "../types/reportTypes";

const TABS: Array<{ value: ReportPeriod; label: string }> = [
  { value: "month", label: "Monthly" },
  { value: "day", label: "Daily" },
];

function ReportSkeleton() {
  return (
    <div role="status" aria-label="Loading the report" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <GlassCard key={index} className="h-24 animate-pulse p-4" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard className="h-64 animate-pulse p-4" />
        <GlassCard className="h-64 animate-pulse p-4" />
      </div>
    </div>
  );
}

// The admin's overview: how the month is going, or what happened on one day.
// It replaces the report that used to be typed by hand and sent as a screenshot.
export function DashboardContent() {
  const tabsId = useId();
  const { period, month, date, today, params, setPeriod, setMonth, setDate } =
    useReportParams();
  const reportQuery = useReportSummary(params);

  function renderReport() {
    if (reportQuery.isPending) {
      return <ReportSkeleton />;
    }

    if (reportQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load the report"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => reportQuery.refetch() }}
        />
      );
    }

    return period === "month" ? (
      <MonthlyReport summary={reportQuery.data} />
    ) : (
      <DailyReport summary={reportQuery.data} />
    );
  }

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold">Reports dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How the work is going, without typing a report by hand.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <PillTabs
          tabs={TABS}
          value={period}
          onChange={setPeriod}
          label="Report type"
          idPrefix={tabsId}
        />

        {period === "month" ? (
          <MonthSwitcher month={month} currentMonth={getCurrentMonth()} onChange={setMonth} />
        ) : (
          <DaySwitcher date={date} today={today} onChange={setDate} />
        )}
      </div>

      <div
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${period}`}
        className="mt-6"
      >
        {renderReport()}
      </div>
    </div>
  );
}
