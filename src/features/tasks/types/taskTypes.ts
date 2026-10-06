// Mirrors the FastAPI JSON (snake_case)

import type { ContentType } from "../../content-types/types/contentTypeTypes";

// new -> todo -> ongoing -> submitted -> done, and submitted -> fix -> submitted.
// A card is "new" until someone is assigned to it.
export type TaskStatus =
  | "new"
  | "todo"
  | "ongoing"
  | "submitted"
  | "fix"
  | "done";

export interface TaskPerson {
  id: number;
  name: string;
}

// A card on the content calendar and a task on the board are the same thing
export interface Task {
  id: number;
  client: { id: number; name: string };
  content_type: ContentType;
  month: string; // "YYYY-MM"
  title: string;
  content: string;
  status: TaskStatus;
  created_by: TaskPerson;
  assigned_to: TaskPerson | null;
  file_link: string | null;
  posting_date: string | null; // "YYYY-MM-DD"
  deadline: string | null; // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

export interface TaskListParams {
  month?: string;
  client_id?: number;
  assigned_to?: number;
  status?: TaskStatus;
  limit?: number;
  offset?: number;
}

export interface TaskCreateRequest {
  client_id: number;
  content_type_id: number;
  month: string;
  title: string;
  content?: string;
  posting_date?: string | null;
  deadline?: string | null;
  // Needs the can_assign permission. A card created with an assignee starts as "todo".
  assigned_to?: number | null;
}

// Only fields that are present change. Not allowed once work has started.
export interface TaskUpdateRequest {
  content_type_id?: number;
  month?: string;
  title?: string;
  content?: string;
  posting_date?: string | null;
  deadline?: string | null;
  // null removes the assignee (a "todo" card goes back to "new")
  assigned_to?: number | null;
}
