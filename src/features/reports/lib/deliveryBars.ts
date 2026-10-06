import type { ClientReportRow } from "../types/reportTypes";

// Per client, the month's target split three ways for the stacked bar:
// done, written but not done yet, and still to be written
export function toDeliveryBars(rows: ClientReportRow[]) {
  return rows.map((row) => ({
    name: row.client.name,
    delivered: row.delivered,
    in_progress: Math.max(0, row.written - row.delivered),
    to_write: Math.max(0, row.target - row.written),
  }));
}
