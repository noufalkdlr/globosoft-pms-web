import { Link } from "react-router";

import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MessageCard } from "../../../components/ui/MessageCard";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { formatMonth } from "../../../utils/month";
import { calendarLink } from "../lib/calendarLink";
import {
  PROGRESS_LABEL,
  PROGRESS_TONE,
  compareByUrgency,
  getProgressState,
} from "../lib/progress";

import type { ClientMonthOverview } from "../types/overviewTypes";

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <GlassCard className="p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </GlassCard>
  );
}

interface MonthOverviewPanelProps {
  rows: ClientMonthOverview[];
  month: string;
}

// Month-end checklist: every client's progress, what needs attention first
export function MonthOverviewPanel({ rows, month }: MonthOverviewPanelProps) {
  if (rows.length === 0) {
    return (
      <MessageCard
        title="No clients yet"
        description="Add a client with a monthly plan to start writing content."
      />
    );
  }

  const items = rows
    .map((row) => ({
      row,
      name: row.client.name,
      state: getProgressState(row.totals.written, row.totals.target),
    }))
    .sort(compareByUrgency);

  const notStarted = items.filter((item) => item.state === "not-started").length;
  const written = rows.reduce((sum, row) => sum + row.totals.written, 0);
  const target = rows.reduce((sum, row) => sum + row.totals.target, 0);
  const toWrite = rows.reduce((sum, row) => sum + row.totals.to_write, 0);
  const unassigned = rows.reduce((sum, row) => sum + row.totals.unassigned, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Overview for {formatMonth(month)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What is written, what is left, and who still needs a designer.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="Clients not started" value={String(notStarted)} />
        <Metric label="Cards written" value={`${written} of ${target}`} />
        <Metric label="Still to write" value={String(toWrite)} />
        <Metric label="Without a designer" value={String(unassigned)} />
      </dl>

      <ul className="space-y-3">
        {items.map(({ row, state }) => {
          const { totals } = row;

          return (
            <li key={row.client.id}>
              <Link to={calendarLink(month, row.client.id)} className="block">
                <GlassCard className="p-4 transition hover:bg-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{row.client.name}</h3>
                      {row.client.is_archived && <Badge>Archived</Badge>}
                    </div>
                    <Badge
                      variant={
                        state === "complete"
                          ? "success"
                          : state === "not-started"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {PROGRESS_LABEL[state]}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    <ProgressBar
                      label={`${row.client.name} cards written`}
                      value={totals.written}
                      max={totals.target}
                      tone={PROGRESS_TONE[state]}
                    />
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {totals.target > 0
                          ? `${totals.written} of ${totals.target} written`
                          : `${totals.written} written, no plan`}
                      </span>
                      {totals.to_write > 0 && <span>{totals.to_write} to write</span>}
                      {totals.unassigned > 0 && (
                        <span>{totals.unassigned} without a designer</span>
                      )}
                      {totals.extra > 0 && <span>{totals.extra} extra</span>}
                    </p>
                  </div>
                </GlassCard>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
