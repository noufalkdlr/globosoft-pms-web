import { addDaysToIsoDate } from "../../../utils/date";

import type { AuthUser } from "../../auth/types/authTypes";
import type { Task } from "../../tasks/types/taskTypes";

// How far ahead "due soon" looks, counting today
export const DUE_SOON_DAYS = 3;

export type HomeKind = "marketing" | "design";

// Design members (people who receive tasks) get the designer's Home,
// everyone else who is not an admin gets the marketing one
export function getHomeKind(user: Pick<AuthUser, "team">): HomeKind {
  return user.team?.can_receive_tasks ? "design" : "marketing";
}

export interface MarketingSections {
  waiting: Task[];
  correction: Task[];
  unassigned: Task[];
  pendingToday: Task[];
  ongoing: Task[];
}

// Lists keep the order they arrive in: the API sorts by deadline
export function getMarketingSections(
  tasks: Task[],
  today: string,
  currentMonth: string,
): MarketingSections {
  return {
    waiting: tasks.filter((task) => task.status === "submitted"),
    correction: tasks.filter((task) => task.status === "fix"),
    // Next month's cards are written ahead of time and are not "missing" a
    // designer yet, so only this month and earlier count
    unassigned: tasks.filter(
      (task) => task.assigned_to === null && task.month <= currentMonth,
    ),
    // Due today or already overdue, and not finished
    pendingToday: tasks.filter(
      (task) =>
        task.deadline !== null && task.deadline <= today && task.status !== "done",
    ),
    ongoing: tasks.filter((task) => task.status === "ongoing"),
  };
}

export interface DesignSections {
  // Cards to work on, the ones already started first
  myTasks: Task[];
  todo: Task[];
  ongoing: Task[];
  correction: Task[];
  waiting: Task[];
  // Unfinished work due within the next days, overdue included
  dueSoon: Task[];
}

export function getDesignSections(tasks: Task[], today: string): DesignSections {
  const todo = tasks.filter((task) => task.status === "todo");
  const ongoing = tasks.filter((task) => task.status === "ongoing");
  const limit = addDaysToIsoDate(today, DUE_SOON_DAYS);

  return {
    myTasks: [...ongoing, ...todo],
    todo,
    ongoing,
    correction: tasks.filter((task) => task.status === "fix"),
    waiting: tasks.filter((task) => task.status === "submitted"),
    dueSoon: tasks.filter(
      (task) =>
        task.deadline !== null &&
        task.deadline <= limit &&
        ["todo", "ongoing", "fix"].includes(task.status),
    ),
  };
}

// How a card's deadline reads on the Home page
export function getDueLabel(
  task: Pick<Task, "deadline" | "status">,
  today: string,
): { kind: "none" | "overdue" | "today" | "later"; date: string | null } {
  if (task.deadline === null) {
    return { kind: "none", date: null };
  }

  if (task.status !== "done" && task.deadline < today) {
    return { kind: "overdue", date: task.deadline };
  }

  return {
    kind: task.deadline === today ? "today" : "later",
    date: task.deadline,
  };
}
