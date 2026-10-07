import type { ComponentProps } from "react";

import type { Badge } from "../../../components/ui/Badge";
import type { TaskStatus } from "../types/taskTypes";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

// Names match the board columns
export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  ongoing: "Ongoing",
  submitted: "Waiting for approval",
  fix: "Correction",
  done: "Done",
};

export const STATUS_VARIANT: Record<TaskStatus, BadgeVariant> = {
  todo: "neutral",
  ongoing: "brand",
  submitted: "brand",
  fix: "danger",
  done: "success",
};

// The board's columns, left to right
export const BOARD_COLUMNS: TaskStatus[] = [
  "todo",
  "ongoing",
  "submitted",
  "fix",
  "done",
];
