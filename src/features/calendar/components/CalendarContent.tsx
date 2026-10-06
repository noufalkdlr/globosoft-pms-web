import { useState } from "react";
import { Link } from "react-router";

import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { cn } from "../../../utils/cn";
import { formatMonth, getCurrentMonth } from "../../../utils/month";
import { useCalendarCards } from "../hooks/useCalendarCards";
import { useCalendarParams } from "../hooks/useCalendarParams";
import { useMonthOverview } from "../hooks/useMonthOverview";
import { calendarLink } from "../lib/calendarLink";
import { ClientMonthPanel } from "./ClientMonthPanel";
import { ClientPicker } from "./ClientPicker";
import { ClientRail } from "./ClientRail";
import { MonthOverviewPanel } from "./MonthOverviewPanel";
import { MonthSwitcher } from "./MonthSwitcher";

function PanelSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading the month"
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <GlassCard key={index} className="h-20 animate-pulse p-4" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <GlassCard key={index} className="h-24 animate-pulse p-4" />
      ))}
    </div>
  );
}

export function CalendarContent() {
  const { month, clientId, setMonth, selectClient } = useCalendarParams();
  const [railSearch, setRailSearch] = useState("");

  // The client list is a sidebar on wide screens and a dropdown on narrow ones
  const isWide = useMediaQuery("(min-width: 1024px)");

  const overviewQuery = useMonthOverview(month);
  const cardsQuery = useCalendarCards(month, clientId);
  const rows = overviewQuery.data;
  const selected =
    clientId !== null
      ? rows?.find((row) => row.client.id === clientId)
      : undefined;

  function renderPanel() {
    if (overviewQuery.isPending) {
      return <PanelSkeleton />;
    }

    if (overviewQuery.isError) {
      return (
        <MessageCard
          title="Couldn't load this month"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: () => overviewQuery.refetch() }}
        />
      );
    }

    if (clientId === null) {
      return <MonthOverviewPanel rows={rows ?? []} month={month} />;
    }

    if (!selected) {
      return (
        <GlassCard className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="font-medium">No data for this client in {formatMonth(month)}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The client may be archived, or may not exist.
          </p>
          <Link
            to={calendarLink(month)}
            className="mt-3 rounded-lg px-3 py-1.5 text-sm font-medium underline underline-offset-2"
          >
            Back to the overview
          </Link>
        </GlassCard>
      );
    }

    return (
      <ClientMonthPanel
        overview={selected}
        month={month}
        tasksQuery={cardsQuery}
      />
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan and track the month's content for every client.
          </p>
        </div>

        <MonthSwitcher
          month={month}
          currentMonth={getCurrentMonth()}
          onChange={setMonth}
        />
      </header>

      <div
        className={cn(
          "mt-6 grid gap-6",
          isWide && "grid-cols-[16rem_minmax(0,1fr)]",
        )}
      >
        {isWide ? (
          <ClientRail
            rows={rows}
            month={month}
            selectedClientId={clientId}
            search={railSearch}
            onSearchChange={setRailSearch}
          />
        ) : (
          <ClientPicker
            rows={rows}
            selectedClientId={clientId}
            onSelect={selectClient}
          />
        )}

        <section aria-label="Month details" className="min-w-0">
          {renderPanel()}
        </section>
      </div>
    </div>
  );
}
