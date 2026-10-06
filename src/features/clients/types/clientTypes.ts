// Mirrors the FastAPI JSON (snake_case)

import type { ContentType } from "../../content-types/types/contentTypeTypes";

// One line of a client's monthly plan, e.g. 12 posters
export interface PlanItem {
  content_type: ContentType;
  count: number;
}

export interface Client {
  id: number;
  name: string;
  notes: string | null;
  // Clients are never deleted, only archived, so old reports stay intact
  is_archived: boolean;
  // The plan in force for the current month. Computed by the backend from the
  // plan history, never stored on the client itself.
  current_plan: PlanItem[];
}

export interface PlanItemInput {
  content_type_id: number;
  count: number;
}

// "From this month on, the plan is exactly these items". Earlier months keep
// their old plan, so past reports never change. A content type left out of
// `items` ends from that month.
export interface ClientPlanChange {
  effective_from_month: string; // "YYYY-MM"
  items: PlanItemInput[];
}

export interface ClientCreateRequest {
  name: string;
  notes: string | null;
  plan?: ClientPlanChange;
}

export interface ClientUpdateRequest {
  name?: string;
  notes?: string | null;
  is_archived?: boolean;
  plan?: ClientPlanChange;
}

export interface ClientListParams {
  search?: string;
  is_archived?: boolean;
  limit?: number;
  offset?: number;
}
