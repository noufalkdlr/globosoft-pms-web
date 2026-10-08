// Mirrors the FastAPI JSON (snake_case)

import type { ContentType } from "../../content-types/types/contentTypeTypes";

// todo -> ongoing -> submitted -> done, and submitted -> fix -> submitted.
// "Has a designer yet?" is not a status: a card in "todo" with `assigned_to`
// null is simply waiting for someone to give it to a designer.
export type TaskStatus =
  | "todo"
  | "ongoing"
  | "submitted"
  | "fix"
  | "done";

export interface TaskPerson {
  id: number;
  name: string;
  avatar_url: string | null;
}

// A reviewer's decision on a submitted design. Rejecting needs a comment that
// tells the designer what to fix.
export interface TaskReview {
  id: number;
  decision: "approved" | "rejected";
  comment: string | null;
  reviewer: TaskPerson;
  created_at: string;
}

// What a move asks of the person making it
export type MoveInput =
  | "file_link" // the finished design's link is required
  | "optional_file_link" // a link may be given
  | "comment" // a reason is required
  | null;

export interface TaskMove {
  // Where the card would go
  status: TaskStatus;
  input: MoveInput;
}

// What the signed-in person may do with this card right now, worked out by the
// backend. The website and the phone app only read it: they never decide who
// may do what. (The backend refuses anything not listed here anyway.)
export interface TaskActions {
  // Change its content, type, dates
  can_edit: boolean;
  can_delete: boolean;
  // Give it to a designer, or take the designer off
  can_assign: boolean;
  // The statuses this person may move it to. Empty when none.
  moves: TaskMove[];
}

// A card on the content calendar and a task on the board are the same thing
export interface Task {
  id: number;
  client: { id: number; name: string };
  content_type: ContentType;
  month: string; // "YYYY-MM"
  // The card's name. Cards are named after their content type and a number
  // ("Poster 3"), unless a title was given when the card was made.
  title: string;
  // What the post says: the caption and talking points
  content: string;
  // Extra instructions for the designer (colours, size, where the logo goes).
  // Empty when there are none.
  notes: string;
  status: TaskStatus;
  created_by: TaskPerson;
  assigned_to: TaskPerson | null;
  // The link to the finished design, set when the designer submits
  file_link: string | null;
  // The most recent review, or null if the card was never reviewed. For a card
  // in "fix" this is the rejection with the comment to show the designer.
  latest_review: TaskReview | null;
  posting_date: string | null; // "YYYY-MM-DD"
  deadline: string | null; // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
  actions: TaskActions;
}

export interface TaskListParams {
  month?: string;
  client_id?: number;
  assigned_to?: number;
  status?: TaskStatus;
  // Together with `month`: also include cards of earlier months that are not
  // done yet ("late" work that carried over)
  include_late?: boolean;
  limit?: number;
  offset?: number;
}

export interface TaskCreateRequest {
  client_id: number;
  content_type_id: number;
  month: string;
  // Optional. Left out, the card is named after its content type and the next
  // free number among that client's cards of the month: "Poster 3".
  title?: string;
  content?: string;
  notes?: string;
  posting_date?: string | null;
  deadline?: string | null;
  // Needs the can_assign permission. Left out, the card starts in "todo"
  // without a designer.
  assigned_to?: number | null;
}

// Only fields that are present change. Not allowed once work has started.
export interface TaskUpdateRequest {
  // The `updated_at` the person saw. If the card changed since (someone else
  // edited or moved it), the change is refused with 409 instead of overwriting
  // their work. Required.
  updated_at: string;
  content_type_id?: number;
  month?: string;
  title?: string;
  content?: string;
  notes?: string;
  posting_date?: string | null;
  deadline?: string | null;
  // null removes the designer. The card stays in "todo", without a designer.
  assigned_to?: number | null;
}

// Moving a card on the board. Who may move it where is in `Task.actions.moves`.
export interface TaskStatusChangeRequest {
  status: TaskStatus;
  // The `updated_at` the person saw. If the card changed since (someone else
  // moved it), the move is refused with 409 instead of overwriting their work.
  updated_at: string;
  // Required when submitting for approval, optional when resubmitting after a correction
  file_link?: string | null;
  // Required when sending a card back for correction, optional when approving
  comment?: string;
}
