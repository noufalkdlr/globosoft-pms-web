// Months are "YYYY-MM" strings everywhere (API, plans, cards). The month
// boundary is India Standard Time: a card written at 00:30 IST on the 1st
// belongs to the new month even though UTC still shows the previous day.

const APP_TIME_ZONE = "Asia/Kolkata";
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// Writers plan the next month in the last days of a month
export const PLANNING_WINDOW_DAYS = 7;

export function isValidMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

function getIstParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return { year: value("year"), month: value("month"), day: Number(value("day")) };
}

export function getCurrentMonth(now: Date = new Date()): string {
  const { year, month } = getIstParts(now);

  return `${year}-${month}`;
}

export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;

  const newYear = Math.floor(index / 12);
  const newMonth = (index % 12) + 1;

  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);

  // Day 0 of the next month is the last day of this one
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

// The month the content calendar opens on: the current month, except in the
// last PLANNING_WINDOW_DAYS days, when it opens on the next month so writers
// land where they need to be.
export function getDefaultCalendarMonth(now: Date = new Date()): string {
  const current = getCurrentMonth(now);
  const { day } = getIstParts(now);

  return day > daysInMonth(current) - PLANNING_WINDOW_DAYS
    ? addMonths(current, 1)
    : current;
}

// "2026-11" -> "November 2026"
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}
