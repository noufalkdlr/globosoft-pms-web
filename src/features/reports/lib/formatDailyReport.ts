import { formatLongDate } from "../../../utils/date";
import { ACTIVITY_LABEL, ACTIVITY_ORDER } from "./reportLabels";

import type { ReportSummary } from "../types/reportTypes";

// The text of a daily report, ready to paste into WhatsApp or an email. It
// replaces the report that used to be typed by hand every evening.
export function formatDailyReport(summary: ReportSummary): string {
  const lines: string[] = [];
  const title = summary.date ? formatLongDate(summary.date) : summary.month;

  lines.push(`Daily report: ${title}`, "");

  lines.push("Work done");
  lines.push(
    ACTIVITY_ORDER.map((key) => `${ACTIVITY_LABEL[key]} ${summary.activity[key]}`).join(" · "),
  );
  lines.push("");

  // Only people who did something or still have work on their plate
  const designers = summary.by_designer.filter((row) => {
    const done = Object.values(row.activity).reduce((sum, count) => sum + count, 0);

    return done > 0 || row.todo + row.ongoing + row.fix > 0;
  });

  if (designers.length > 0) {
    lines.push("By designer");

    for (const row of designers) {
      const open = row.todo + row.ongoing + row.fix;

      lines.push(
        `• ${row.designer.name}: started ${row.activity.started}, submitted ${row.activity.submitted}, ` +
          `approved ${row.activity.approved}, sent back ${row.activity.sent_back} · ${open} open`,
      );
    }

    lines.push("");
  }

  const clients = summary.by_client.filter(
    (row) =>
      row.activity.submitted + row.activity.approved > 0 ||
      row.remaining > 0 ||
      row.overdue > 0,
  );

  if (clients.length > 0) {
    lines.push("By client");

    for (const row of clients) {
      const parts = [`submitted ${row.activity.submitted}`, `approved ${row.activity.approved}`];

      parts.push(`${row.remaining} left this month`);

      if (row.overdue > 0) {
        parts.push(`${row.overdue} overdue`);
      }

      lines.push(`• ${row.client.name}: ${parts.join(", ")}`);
    }

    lines.push("");
  }

  lines.push(`Overdue right now: ${summary.overdue} ${summary.overdue === 1 ? "card" : "cards"}`);

  return lines.join("\n");
}
