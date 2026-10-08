import { ACTIVITY_COLORS, ACTIVITY_LABEL, ACTIVITY_ORDER } from "../lib/reportLabels";
import { DonutChart } from "./DonutChart";
import { StatTile } from "../../../components/ui/StatTile";
import { ReportTable } from "./ReportTable";

import type {
  ClientReportRow,
  DesignerReportRow,
  ReportSummary,
} from "../types/reportTypes";

interface DailyReportProps {
  summary: ReportSummary;
}

export function DailyReport({ summary }: DailyReportProps) {
  const { activity } = summary;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {ACTIVITY_ORDER.map((key) => (
          <StatTile key={key} label={ACTIVITY_LABEL[key]} value={activity[key]} />
        ))}
      </div>

      <DonutChart
        title="What happened"
        emptyText="Nothing happened on this day."
        slices={ACTIVITY_ORDER.map((key) => ({
          key,
          label: ACTIVITY_LABEL[key],
          value: activity[key],
          color: ACTIVITY_COLORS[key],
        }))}
      />

      <ReportTable<DesignerReportRow>
        title="Designers"
        emptyText="No designers yet."
        rows={summary.by_designer}
        rowKey={(row) => row.designer.id}
        columns={[
          { key: "designer", header: "Designer", render: (row) => row.designer.name },
          { key: "started", header: "Started", numeric: true, render: (row) => row.activity.started },
          { key: "submitted", header: "Submitted", numeric: true, render: (row) => row.activity.submitted },
          { key: "approved", header: "Approved", numeric: true, render: (row) => row.activity.approved },
          { key: "sent_back", header: "Sent back", numeric: true, render: (row) => row.activity.sent_back },
          {
            key: "open",
            header: "Open now",
            numeric: true,
            render: (row) => row.todo + row.ongoing + row.fix,
          },
        ]}
      />

      <ReportTable<ClientReportRow>
        title="Clients"
        emptyText="No client has a plan or cards for this month."
        rows={summary.by_client}
        rowKey={(row) => row.client.id}
        columns={[
          { key: "client", header: "Client", render: (row) => row.client.name },
          { key: "submitted", header: "Submitted", numeric: true, render: (row) => row.activity.submitted },
          { key: "approved", header: "Approved", numeric: true, render: (row) => row.activity.approved },
          { key: "remaining", header: "Left this month", numeric: true, render: (row) => row.remaining },
          { key: "overdue", header: "Overdue now", numeric: true, render: (row) => row.overdue },
        ]}
      />
    </div>
  );
}
