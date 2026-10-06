import { fakeApiError } from "../../../lib/api/dummyHelpers";
import { getTodayIst, isValidIsoDate } from "../../../utils/date";
import { daysInMonth, getCurrentMonth, isValidMonth } from "../../../utils/month";
import {
  getPlanForMonth,
  listClientRows,
} from "../../clients/api/dummyClients";
import {
  getReportSource,
  type ReportEventRow,
  type ReportTaskRow,
} from "../../tasks/api/dummyTasks";
import {
  findUser,
  listActiveDesigners,
  requireAdmin,
} from "../../users/api/dummyUsers";

import type { TaskStatus } from "../../tasks/types/taskTypes";
import type {
  ClientReportRow,
  DesignerReportRow,
  ReportActivity,
  ReportParams,
  ReportSummary,
} from "../types/reportTypes";

// TEMPORARY: stands in for GET /reports/summary of the FastAPI backend. The
// real one does this counting in SQL (GROUP BY), not in a loop like here.
// Delete this file once the real API is connected.

const IST_OFFSET_MINUTES = 5 * 60 + 30;
const STATUSES: TaskStatus[] = ["new", "todo", "ongoing", "submitted", "fix", "done"];

// The IST calendar date of a moment: a card approved at 00:15 IST belongs to
// that day, even though it is still the evening before in UTC
function istDateOf(isoMoment: string): string {
  const moment = new Date(isoMoment).getTime() + IST_OFFSET_MINUTES * 60 * 1000;

  return new Date(moment).toISOString().slice(0, 10);
}

function emptyActivity(): ReportActivity {
  return { created: 0, assigned: 0, started: 0, submitted: 0, approved: 0, sent_back: 0 };
}

// Which kind of activity an event is, or null for the ones nobody reports
// (a card going back to New when its designer is removed, for example)
function activityOf(event: ReportEventRow): keyof ReportActivity | null {
  if (event.from_status === null) {
    return "created";
  }

  if (event.from_status === "new" && event.to_status === "todo") {
    return "assigned";
  }

  switch (event.to_status) {
    case "ongoing":
      return "started";
    case "submitted":
      return "submitted";
    case "done":
      return "approved";
    case "fix":
      return "sent_back";
    default:
      return null;
  }
}

function resolveRange(params: ReportParams) {
  if (params.period !== "day" && params.period !== "month") {
    throw fakeApiError(422, "Choose day or month.");
  }

  if (params.period === "day") {
    const date = params.date ?? getTodayIst();

    if (!isValidIsoDate(date)) {
      throw fakeApiError(422, "Enter a valid date.");
    }

    return { period: "day" as const, date, month: date.slice(0, 7), from: date, to: date };
  }

  const month = params.month ?? getCurrentMonth();

  if (!isValidMonth(month)) {
    throw fakeApiError(422, "Enter a valid month.");
  }

  return {
    period: "month" as const,
    date: null,
    month,
    from: `${month}-01`,
    to: `${month}-${String(daysInMonth(month)).padStart(2, "0")}`,
  };
}

export function getReportSummary(params: ReportParams): ReportSummary {
  requireAdmin();

  const range = resolveRange(params);
  const today = getTodayIst();
  const source = getReportSource();

  const taskById = new Map<number, ReportTaskRow>(source.tasks.map((task) => [task.id, task]));

  // Events inside the period, for cards that still exist
  const events = source.events.filter((event) => {
    const day = istDateOf(event.created_at);

    return taskById.has(event.task_id) && day >= range.from && day <= range.to;
  });

  const activity = emptyActivity();
  for (const event of events) {
    const kind = activityOf(event);

    if (kind) {
      activity[kind] += 1;
    }
  }

  // The month's own cards, by their status right now
  const monthCards = source.tasks.filter((task) => task.month === range.month);
  const statusCounts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>;
  for (const card of monthCards) {
    statusCounts[card.status] += 1;
  }

  // Unfinished work, right now
  const unfinished = source.tasks.filter((task) => task.status !== "done");
  const isOverdue = (task: ReportTaskRow) => task.deadline !== null && task.deadline < today;

  // ---- per client
  const clientRows: ClientReportRow[] = [];
  let planTarget = 0;

  for (const client of listClientRows()) {
    const target = getPlanForMonth(client.id, range.month).reduce((sum, item) => sum + item.count, 0);
    const cards = monthCards.filter((card) => card.client_id === client.id);

    // Nothing to report: no plan and no cards, or an archived client that
    // wrote nothing this month (archived clients are no longer planned for,
    // the same rule the content calendar's overview follows)
    if ((target === 0 && cards.length === 0) || (client.is_archived && cards.length === 0)) {
      continue;
    }

    const delivered = cards.filter((card) => card.status === "done").length;
    const clientEvents = events.filter((event) => taskById.get(event.task_id)?.client_id === client.id);
    planTarget += target;

    clientRows.push({
      client: { id: client.id, name: client.name, is_archived: client.is_archived },
      target,
      written: cards.length,
      delivered,
      remaining: Math.max(0, target - delivered),
      overdue: unfinished.filter((task) => task.client_id === client.id && isOverdue(task)).length,
      late: unfinished.filter((task) => task.client_id === client.id && task.month < range.month).length,
      activity: {
        submitted: clientEvents.filter((event) => activityOf(event) === "submitted").length,
        approved: clientEvents.filter((event) => activityOf(event) === "approved").length,
      },
    });
  }

  // The ones that need attention first: overdue, then what is left, then by name
  clientRows.sort(
    (a, b) =>
      b.overdue - a.overdue ||
      b.remaining - a.remaining ||
      a.client.name.localeCompare(b.client.name),
  );

  // ---- per designer: every active Design member, plus anyone who holds a card
  const designers = new Map<number, string>(listActiveDesigners().map((d) => [d.id, d.name]));

  for (const task of source.tasks) {
    if (task.assigned_to_id !== null && !designers.has(task.assigned_to_id)) {
      designers.set(task.assigned_to_id, findUser(task.assigned_to_id)?.name ?? "Unknown");
    }
  }

  const designerRows: DesignerReportRow[] = [...designers].map(([id, name]) => {
    const plate = unfinished.filter((task) => task.assigned_to_id === id);
    const theirEvents = events.filter((event) => taskById.get(event.task_id)?.assigned_to_id === id);
    const count = (kind: keyof ReportActivity) =>
      theirEvents.filter((event) => activityOf(event) === kind).length;

    return {
      designer: { id, name },
      todo: plate.filter((task) => task.status === "todo").length,
      ongoing: plate.filter((task) => task.status === "ongoing").length,
      submitted: plate.filter((task) => task.status === "submitted").length,
      fix: plate.filter((task) => task.status === "fix").length,
      delivered: monthCards.filter((card) => card.assigned_to_id === id && card.status === "done").length,
      activity: {
        started: count("started"),
        submitted: count("submitted"),
        approved: count("approved"),
        sent_back: count("sent_back"),
      },
    };
  });

  designerRows.sort((a, b) => a.designer.name.localeCompare(b.designer.name));

  return {
    period: range.period,
    date: range.date,
    month: range.month,
    from: range.from,
    to: range.to,
    status_counts: statusCounts,
    activity,
    plan: {
      target: planTarget,
      written: monthCards.length,
      delivered: statusCounts.done,
    },
    overdue: unfinished.filter(isOverdue).length,
    by_client: clientRows,
    by_designer: designerRows,
  };
}
