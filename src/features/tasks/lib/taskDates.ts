import type { Task } from "../types/taskTypes";

// A deadline that has passed on a card that is not finished. `today` is today's
// date in IST ("YYYY-MM-DD"), passed in so every card agrees on "today".
export function isOverdue(
  task: Pick<Task, "deadline" | "status">,
  today: string,
): boolean {
  return (
    task.deadline !== null && task.deadline < today && task.status !== "done"
  );
}

// Work from an earlier month that is still not done, seen on a later month's board
export function isLate(
  task: Pick<Task, "month" | "status">,
  boardMonth: string,
): boolean {
  return task.month < boardMonth && task.status !== "done";
}

// Only plain web links become clickable. The backend already refuses anything
// else, this is a second lock in case a bad value ever gets through.
export function isSafeLink(value: string | null): value is string {
  return value !== null && /^https?:\/\//i.test(value);
}

// The same check the backend applies to a design link: a real http(s) address
export function isValidFileLink(value: string): boolean {
  const link = value.trim();

  if (link.length === 0 || link.length > 500) {
    return false;
  }

  try {
    const url = new URL(link);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
