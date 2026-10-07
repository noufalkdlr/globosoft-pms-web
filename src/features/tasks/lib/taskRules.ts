import { can } from "../../../lib/permissions";

import { STATUS_LABEL } from "./taskStatus";

import type { AuthUser } from "../../auth/types/authTypes";
import type { Task, TaskStatus } from "../types/taskTypes";

// The rules for moving a card from one status to another. This is the single
// place they are written: the board uses it to decide which columns accept a
// drop, and the dummy backend (and, later, the real one) enforces the same
// table. The backend must enforce it, because hiding a button protects nothing.
//
//   todo -> ongoing    the card's designer (a card nobody holds cannot start)
//   ongoing -> submitted  the card's designer      gives the link to the finished design
//   submitted -> done  someone with can_review
//   submitted -> fix   someone with can_review     must say what to fix (comment)
//   fix -> submitted   the card's designer         may give a new link
//
// Admins may make any move in the table, except starting a card nobody holds.
//
// Giving a card to a designer is not a move: it is done with the assign dialog
// (PATCH /tasks/{id} with `assigned_to`) and leaves the card in "todo".

export type MoveActor = "assignee" | "reviewer";

// What the person making the move has to supply
export type MoveInput =
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

  // A card with no designer cannot be worked on, whoever asks
  if (rule.actor === "assignee" && !task.assigned_to) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  switch (rule.actor) {
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

// Why this person cannot make this move, in words for a message, or null when
// they can. The same table decides, so the message always matches the rule.
export function getMoveBlockReason(
  user: AuthUser | null | undefined,
  task: Pick<Task, "status" | "assigned_to">,
  to: TaskStatus,
): string | null {
  const rule = getMoveRule(task.status, to);

  if (!rule) {
    return `A card that is "${STATUS_LABEL[task.status]}" can't move to "${STATUS_LABEL[to]}".`;
  }

  if (canMove(user, task, to)) {
    return null;
  }

  switch (rule.actor) {
    case "reviewer":
      return "Only a reviewer can approve a card or send it back.";
    case "assignee":
      return task.assigned_to
        ? `Only ${task.assigned_to.name}, who has this card, can move it forward.`
        : "Give this card to a designer first.";
  }
}
