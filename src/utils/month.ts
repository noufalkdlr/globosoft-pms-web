// Months are "YYYY-MM" strings everywhere (API, plans, cards). The month
// boundary is India Standard Time: a card written at 00:30 IST on the 1st
// belongs to the new month even though UTC still shows the previous day.

const APP_TIME_ZONE = "Asia/Kolkata";
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

export function getCurrentMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}

export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;

  const newYear = Math.floor(index / 12);
  const newMonth = (index % 12) + 1;

  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

// "2026-11" -> "November 2026"
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}
