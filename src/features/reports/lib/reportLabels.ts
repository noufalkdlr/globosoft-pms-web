import type { ReportActivity } from "../types/reportTypes";

// Chart colours. They echo the theme: brand red for work in progress, yellow
// for "waiting on someone", green for finished. (Charts are drawn in SVG, so
// they take plain colour values rather than Tailwind classes.)
export const STATUS_COLORS = {
  new: "#8e8e93",
  todo: "#6f7d95",
  ongoing: "#e11d2e",
  submitted: "#ffd60a",
  fix: "#ff9f0a",
  done: "#30d158",
} as const;

export const ACTIVITY_COLORS: Record<keyof ReportActivity, string> = {
  created: "#8e8e93",
  assigned: "#6f7d95",
  started: "#e11d2e",
  submitted: "#ffd60a",
  approved: "#30d158",
  sent_back: "#ff9f0a",
};

// What each kind of activity is called on screen, in the order they happen
export const ACTIVITY_LABEL: Record<keyof ReportActivity, string> = {
  created: "Written",
  assigned: "Assigned",
  started: "Started",
  submitted: "Submitted",
  approved: "Approved",
  sent_back: "Sent back",
};

export const ACTIVITY_ORDER: Array<keyof ReportActivity> = [
  "created",
  "assigned",
  "started",
  "submitted",
  "approved",
  "sent_back",
];
