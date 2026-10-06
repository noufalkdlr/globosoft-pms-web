// Mirrors the FastAPI JSON (snake_case)

import type { ContentType } from "../../content-types/types/contentTypeTypes";

// All numbers are computed by the backend from the plan and the cards of the
// month. They are never stored, so they can never drift out of date.
export interface ProgressNumbers {
  // How many the client's plan asks for this month
  target: number;
  // Cards created (any status)
  written: number;
  // Cards that have a designer
  assigned: number;
  // Cards with status "done"
  done: number;
  // max(target - written, 0): still to be written
  to_write: number;
  // max(written - target, 0): cards beyond the target
  extra: number;
  // max(target - done, 0): still to be delivered
  delivery_remaining: number;
  // Part of delivery_remaining that already has content and waits on design:
  // delivery_remaining - to_write
  to_design: number;
}

export interface TypeProgress extends ProgressNumbers {
  content_type: ContentType;
}

export interface ClientMonthOverview {
  client: { id: number; name: string; is_archived: boolean };
  month: string;
  // One entry per content type in the plan or with cards this month
  types: TypeProgress[];
  totals: ProgressNumbers & {
    // Cards with no designer yet
    unassigned: number;
  };
}
