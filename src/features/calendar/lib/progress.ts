export type ProgressState =
  | "no-plan"
  | "not-started"
  | "in-progress"
  | "complete";

// How far a client is with writing its cards for a month
export function getProgressState(written: number, target: number): ProgressState {
  if (target === 0) {
    return "no-plan";
  }

  if (written === 0) {
    return "not-started";
  }

  return written < target ? "in-progress" : "complete";
}

export const PROGRESS_LABEL: Record<ProgressState, string> = {
  "no-plan": "No plan",
  "not-started": "Not started",
  "in-progress": "In progress",
  complete: "Complete",
};

// Dot colors: red = not started, yellow = in progress, green = complete
export const PROGRESS_DOT_CLASS: Record<ProgressState, string> = {
  "no-plan": "bg-muted-foreground/40",
  "not-started": "bg-destructive",
  "in-progress": "bg-warning",
  complete: "bg-success",
};

export const PROGRESS_TONE = {
  "no-plan": "brand",
  "not-started": "danger",
  "in-progress": "warning",
  complete: "success",
} as const;

// Month-end checklist order: what needs attention comes first
const URGENCY: Record<ProgressState, number> = {
  "not-started": 0,
  "in-progress": 1,
  "no-plan": 2,
  complete: 3,
};

export function compareByUrgency(
  a: { state: ProgressState; name: string },
  b: { state: ProgressState; name: string },
): number {
  return URGENCY[a.state] - URGENCY[b.state] || a.name.localeCompare(b.name);
}
