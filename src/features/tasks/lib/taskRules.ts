import { can } from "../../../lib/permissions";

import type { AuthUser } from "../../auth/types/authTypes";
import type { Task, TaskStatus } from "../types/taskTypes";

// The rules for moving a card from one status to another. This is the single
// place they are written: the board uses it to decide which columns accept a
// drop, and the dummy backend (and, later, the real one) enforces the same
// table. The backend must enforce it, because hiding a button protects nothing.
//
//   new -> todo        someone with can_assign     picks a designer (assign dialog)
//   todo -> ongoing    the card's designer
//   ongoing -> submitted  the card's designer      gives the link to the finished design
//   submitted -> done  someone with can_review
//   submitted -> fix   someone with can_review     must say what to fix (comment)
//   fix -> submitted   the card's designer         may give a new link
//
// Admins may make any move in the table.

export type MoveActor = "assigner" | "assignee" | "reviewer";

// What the person making the move has to supply
export type MoveInput =
  | "designer" // choose who gets the card
  | "file_link" // the finished design's link is required
  | "optional_file_link" // a link may be given
  | "comment" // a reason is required
  | null;

export interface MoveRule {
  from: TaskStatus;
  to: TaskStatus;
  actor: MoveActor;
  input: MoveInput;
}

export const MOVE_RULES: MoveRule[] = [
  { from: "new", to: "todo", actor: "assigner", input: "designer" },
  { from: "todo", to: "ongoing", actor: "assignee", input: null },
  { from: "ongoing", to: "submitted", actor: "assignee", input: "file_link" },
  { from: "submitted", to: "done", actor: "reviewer", input: null },
  { from: "submitted", to: "fix", actor: "reviewer", input: "comment" },
  { from: "fix", to: "submitted", actor: "assignee", input: "optional_file_link" },
];

export function getMoveRule(
  from: TaskStatus,
  to: TaskStatus,
): MoveRule | undefined {
  return MOVE_RULES.find((rule) => rule.from === from && rule.to === to);
}

// Whether this person may make this move on this card
export function canMove(
  user: AuthUser | null | undefined,
  task: Pick<Task, "status" | "assigned_to">,
  to: TaskStatus,
): boolean {
  const rule = getMoveRule(task.status, to);

  if (!rule || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  switch (rule.actor) {
    case "assigner":
      return can(user, "can_assign");
    case "reviewer":
      return can(user, "can_review");
    case "assignee":
      return task.assigned_to?.id === user.id;
  }
}

// Every status this person may move the card to: the columns that accept a drop
export function getAllowedMoves(
  user: AuthUser | null | undefined,
  task: Pick<Task, "status" | "assigned_to">,
): TaskStatus[] {
  return MOVE_RULES.filter((rule) => rule.from === task.status)
    .map((rule) => rule.to)
    .filter((to) => canMove(user, task, to));
}
