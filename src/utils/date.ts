// Dates without a time, written "YYYY-MM-DD" (posting dates, deadlines)

const APP_TIME_ZONE = "Asia/Kolkata";

// True only for real calendar dates: "2026-02-30" and "2026-13-01" are not
export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Today's date in IST, e.g. "2026-10-06". Used to tell whether a deadline has passed.
export function getTodayIst(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return `${value("year")}-${value("month")}-${value("day")}`;
}

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-11-20" -> "20 Nov". The month names come from a fixed list because
// browsers disagree on some ("Sep" or "Sept"), and a date should read the same
// on everyone's screen.
export function formatShortDate(value: string): string {
  const [, month, day] = value.split("-").map(Number);

  return `${day} ${MONTH_ABBREVIATIONS[month - 1]}`;
}

// "2026-10-30" + 3 days -> "2026-11-02"
export function addDaysToIsoDate(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

// "2026-10-06" -> "Tuesday, 6 October 2026". Built from parts because browsers
// differ on the comma, and this should read the same everywhere.
export function formatLongDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date(Date.UTC(year, month - 1, day)));

  const part = (type: string) => parts.find((item) => item.type === type)?.value;

  return `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")}`;
}
