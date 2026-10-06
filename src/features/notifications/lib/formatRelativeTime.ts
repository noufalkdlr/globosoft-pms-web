import { formatShortDate } from "../../../utils/date";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// The date in India ("YYYY-MM-DD") of a moment
function istDate(moment: Date): string {
  return new Date(moment.getTime() + 5.5 * HOUR).toISOString().slice(0, 10);
}

// "just now", "5 min ago", "3 h ago", "yesterday", then a date like "12 Oct"
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diff = now.getTime() - then.getTime();

  if (diff < 45 * 1000) {
    return "just now";
  }

  if (diff < HOUR) {
    return `${Math.max(1, Math.round(diff / MINUTE))} min ago`;
  }

  if (diff < DAY) {
    return `${Math.round(diff / HOUR)} h ago`;
  }

  // Days are the days in India, so "yesterday" means the calendar day before
  const yesterday = istDate(new Date(now.getTime() - DAY));

  return istDate(then) === yesterday ? "yesterday" : formatShortDate(istDate(then));
}
