import { Link } from "react-router";

import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { ROUTES } from "../../../lib/routes";
import { cn } from "../../../utils/cn";
import { addMonths, formatMonth, getCurrentMonth } from "../../../utils/month";
import { useMonthOverview } from "../../calendar/hooks/useMonthOverview";
import { calendarLink } from "../../calendar/lib/calendarLink";
import { getProgressState } from "../../calendar/lib/progress";

// How many client names to list before "and N more"
const NAME_LIMIT = 5;

// Marketing's reminder to write next month's content: how many clients have
// not started, how far the writing is, and a shortcut to the calendar
export function NextMonthCard() {
  const month = addMonths(getCurrentMonth(), 1);
  const overviewQuery = useMonthOverview(month);
  const rows = overviewQuery.data;

  function renderBody() {
    if (overviewQuery.isPending) {
      return (
        <div
          role="status"
          aria-label="Loading next month"
          className="space-y-3"
        >
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
          <div className="h-2 w-full animate-pulse rounded bg-white/10" />
        </div>
      );
    }

    if (overviewQuery.isError || !rows) {
      return (
        <p className="text-sm text-muted-foreground">
          Couldn't load next month's progress.{" "}
          <button
            type="button"
            onClick={() => overviewQuery.refetch()}
            className="underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      );
    }

    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No client has a plan for this month yet. Add one under{" "}
          <Link to={ROUTES.clients} className="underline underline-offset-2">
            Clients
          </Link>
          .
        </p>
      );
    }

    const items = rows.map((row) => ({
      row,
      state: getProgressState(row.totals.written, row.totals.target),
    }));
    const notStarted = items.filter((item) => item.state === "not-started");
    const written = rows.reduce((sum, row) => sum + row.totals.written, 0);
    const target = rows.reduce((sum, row) => sum + row.totals.target, 0);
    const allDone = rows.length > 0 && written >= target && target > 0;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm">
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums",
                notStarted.length > 0 && "text-destructive",
              )}
            >
              {notStarted.length}
            </span>{" "}
            of {rows.length} {rows.length === 1 ? "client" : "clients"} not started
          </p>
          <p className="text-xs text-muted-foreground">
            {written} of {target} cards written
          </p>
        </div>

        <ProgressBar
          label="Next month cards written"
          value={written}
          max={target}
          tone={allDone ? "success" : "brand"}
        />

        {notStarted.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {notStarted.slice(0, NAME_LIMIT).map(({ row }) => (
              <li key={row.client.id}>
                <Link to={calendarLink(month, row.client.id)}>
                  <Badge variant="danger" className="transition hover:opacity-80">
                    {row.client.name}
                  </Badge>
                </Link>
              </li>
            ))}
            {notStarted.length > NAME_LIMIT && (
              <li className="self-center text-xs text-muted-foreground">
                and {notStarted.length - NAME_LIMIT} more
              </li>
            )}
          </ul>
        )}

        {rows.length > 0 && notStarted.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Every client has started.
          </p>
        )}
      </div>
    );
  }

  return (
    <GlassCard className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Next month: {formatMonth(month)}</h2>
        {/* A link styled like a button: a real button inside a link is invalid HTML */}
        <Link
          to={calendarLink(month)}
          className="inline-flex h-9 items-center rounded-full border border-border bg-white/5 px-4 text-sm font-medium transition hover:bg-white/10"
        >
          Open calendar
        </Link>
      </div>

      {renderBody()}
    </GlassCard>
  );
}
