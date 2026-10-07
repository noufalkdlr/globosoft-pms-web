import { useId, useState } from "react";
import { ClipboardCopy } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { MonthSwitcher } from "../../../components/ui/MonthSwitcher";
import { PillTabs } from "../../../components/ui/PillTabs";
import { getCurrentMonth } from "../../../utils/month";
import { useReportParams } from "../hooks/useReportParams";
import { useReportSummary } from "../hooks/useReportSummary";
import { formatDailyReport } from "../lib/formatDailyReport";
import { DailyReport } from "./DailyReport";
import { DaySwitcher } from "./DaySwitcher";
import { MonthlyReport } from "./MonthlyReport";
import { ReportTextDialog } from "./ReportTextDialog";

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
  // The daily report as text, to paste into WhatsApp or an email
  const [isShowingText, setIsShowingText] = useState(false);

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
          <div className="flex flex-wrap items-center gap-3">
            <DaySwitcher date={date} today={today} onChange={setDate} />
            {/* The page's main job for a day, so it sits with the day's controls */}
            <Button
              variant="glass"
              className="h-10 gap-2 px-4 text-sm"
              disabled={!reportQuery.isSuccess}
              onClick={() => setIsShowingText(true)}
            >
              <ClipboardCopy className="size-4" aria-hidden="true" />
              Copy report
            </Button>
          </div>
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

      {isShowingText && period === "day" && reportQuery.isSuccess && (
        <ReportTextDialog
          text={formatDailyReport(reportQuery.data)}
          onClose={() => setIsShowingText(false)}
        />
      )}
    </div>
  );
}
