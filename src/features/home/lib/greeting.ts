const TIME_ZONE = "Asia/Kolkata";

function getIstHour(now: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(now)
    .find((part) => part.type === "hour")?.value;

  return Number(hour);
}

// Based on the time in India, wherever the browser is
export function getGreeting(now: Date = new Date()): string {
  const hour = getIstHour(now);

  if (hour < 12) {
    return "Good morning";
  }

  return hour < 17 ? "Good afternoon" : "Good evening";
}

// "Tuesday, 6 October". Built from parts because browsers differ on the comma
// (newer ones write "Tuesday 6 October"), and this should read the same everywhere.
export function formatToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(now);

  const value = (type: string) => parts.find((part) => part.type === type)?.value;

  return `${value("weekday")}, ${value("day")} ${value("month")}`;
}
