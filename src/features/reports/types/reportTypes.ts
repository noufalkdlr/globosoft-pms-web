// Mirrors the FastAPI JSON (snake_case)

import type { TaskStatus } from "../../tasks/types/taskTypes";

export type ReportPeriod = "day" | "month";

export interface ReportParams {
  period: ReportPeriod;
  // "YYYY-MM-DD", for a daily report. Defaults to today (IST).
  date?: string;
  // "YYYY-MM", for a monthly report. Defaults to the current month.
  month?: string;
}

// What happened during the period, counted from the status history
export interface ReportActivity {
  // Cards written
  created: number;
  // Cards given to a designer that had none before
  assigned: number;
  started: number;
  submitted: number;
  approved: number;
  sent_back: number;
}

export interface ClientReportRow {
  client: { id: number; name: string; is_archived: boolean };
  // From the client's monthly plan
  target: number;
  // Cards written for the month
  written: number;
  // Cards of the month that are done
  delivered: number;
  // target minus delivered, never below zero
  remaining: number;
  // Unfinished cards past their deadline, right now (any month)
  overdue: number;
  // Unfinished cards from earlier months, right now
  late: number;
  activity: { submitted: number; approved: number };
}

export interface DesignerReportRow {
  designer: { id: number; name: string };
  // What is on their plate right now: their unfinished cards, any month
  todo: number;
  ongoing: number;
  submitted: number;
  fix: number;
  // Cards of the report's month that are done
  delivered: number;
  // During the period: cards of theirs that moved
  activity: { started: number; submitted: number; approved: number; sent_back: number };
}

export interface ReportSummary {
  period: ReportPeriod;
  // The day for a daily report, null for a monthly one
  date: string | null;
  // The month the numbers are about (a day's month for a daily report)
  month: string;
  // The first and last day of the period, "YYYY-MM-DD"
  from: string;
  to: string;
  // The month's cards by their status right now
  status_counts: Record<TaskStatus, number>;
  // Of those cards, how many have no designer yet. They are counted in
  // `status_counts.todo` too.
  unassigned: number;
  activity: ReportActivity;
  plan: { target: number; written: number; delivered: number };
  // All unfinished cards past their deadline right now
  overdue: number;
  by_client: ClientReportRow[];
  by_designer: DesignerReportRow[];
}
