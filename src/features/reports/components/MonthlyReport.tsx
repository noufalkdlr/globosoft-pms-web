import { Link } from "react-router";

import { Badge } from "../../../components/ui/Badge";
import { ROUTES } from "../../../lib/routes";
import { STATUS_LABEL } from "../../tasks/lib/taskStatus";
import { calendarLink } from "../../calendar/lib/calendarLink";
import { STATUS_COLORS } from "../lib/reportLabels";
import { ClientDeliveryChart } from "./ClientDeliveryChart";
import { DonutChart } from "./DonutChart";
import { MetricTile } from "./MetricTile";
import { ReportTable } from "./ReportTable";

import type { TaskStatus } from "../../tasks/types/taskTypes";
import type {
  ClientReportRow,
  DesignerReportRow,
  ReportSummary,
} from "../types/reportTypes";

const STATUS_ORDER: TaskStatus[] = ["todo", "ongoing", "submitted", "fix", "done"];

// "Behind" means a card is past its deadline and not finished
function ClientStatus({ row }: { row: ClientReportRow }) {
  if (row.overdue > 0) {
    return <Badge variant="danger">Behind</Badge>;
  }

  if (row.target === 0) {
    return <Badge>No plan</Badge>;
  }

  return row.delivered >= row.target ? (
    <Badge variant="success">Complete</Badge>
  ) : (
    <Badge>On track</Badge>
  );
}

interface MonthlyReportProps {
  summary: ReportSummary;
}

export function MonthlyReport({ summary }: MonthlyReportProps) {
  const { plan, status_counts: counts } = summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricTile label="Delivered" value={`${plan.delivered} of ${plan.target}`} />
        <MetricTile label="Written" value={`${plan.written} of ${plan.target}`} />
        <MetricTile
          label="Without a designer"
          value={summary.unassigned}
          tone="warning"
        />
        <MetricTile label="Waiting for approval" value={counts.submitted} />
        <MetricTile label="In correction" value={counts.fix} />
        <MetricTile label="Overdue" value={summary.overdue} hint="right now" tone="danger" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <DonutChart
          title="Cards by status"
          emptyText="No cards for this month yet."
          slices={[
            // "To do" is split in two: cards waiting for a designer, and cards
            // a designer has but has not started
            {
              key: "unassigned",
              label: "Without a designer",
              value: summary.unassigned,
              color: STATUS_COLORS.unassigned,
            },
            ...STATUS_ORDER.map((status) => ({
              key: status,
              label: status === "todo" ? "To do" : STATUS_LABEL[status],
              value:
                status === "todo" ? counts.todo - summary.unassigned : counts[status],
              color: STATUS_COLORS[status],
            })),
          ]}
        />
        <ClientDeliveryChart rows={summary.by_client} />
      </div>

      <ReportTable<ClientReportRow>
        title="Clients"
        emptyText="No client has a plan or cards for this month."
        rows={summary.by_client}
        rowKey={(row) => row.client.id}
        columns={[
          {
            key: "client",
            header: "Client",
            render: (row) => (
              <Link
                to={calendarLink(summary.month, row.client.id)}
                className="underline-offset-2 hover:underline"
              >
                {row.client.name}
                {row.client.is_archived && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Archived</span>
                )}
              </Link>
            ),
          },
          { key: "target", header: "Target", numeric: true, render: (row) => row.target },
          { key: "written", header: "Written", numeric: true, render: (row) => row.written },
          { key: "delivered", header: "Delivered", numeric: true, render: (row) => row.delivered },
          { key: "remaining", header: "Left", numeric: true, render: (row) => row.remaining },
          { key: "overdue", header: "Overdue", numeric: true, render: (row) => row.overdue },
          { key: "status", header: "Status", render: (row) => <ClientStatus row={row} /> },
        ]}
      />

      <ReportTable<DesignerReportRow>
        title="Designers, on their plate right now"
        emptyText="No designers yet."
        rows={summary.by_designer}
        rowKey={(row) => row.designer.id}
        columns={[
          { key: "designer", header: "Designer", render: (row) => row.designer.name },
          { key: "todo", header: "To do", numeric: true, render: (row) => row.todo },
          { key: "ongoing", header: "Ongoing", numeric: true, render: (row) => row.ongoing },
          { key: "submitted", header: "Waiting", numeric: true, render: (row) => row.submitted },
          { key: "fix", header: "Correction", numeric: true, render: (row) => row.fix },
          {
            key: "delivered",
            header: "Delivered this month",
            numeric: true,
            render: (row) => row.delivered,
          },
        ]}
      />

      <p className="text-xs text-muted-foreground">
        Overdue and the designers' plates are as of right now. See the{" "}
        <Link to={ROUTES.board} className="underline underline-offset-2">
          board
        </Link>{" "}
        for the cards themselves.
      </p>
    </div>
  );
}
