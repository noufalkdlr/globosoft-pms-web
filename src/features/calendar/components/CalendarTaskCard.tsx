import { Pencil, Trash2, UserPlus } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { IconButton } from "../../../components/ui/IconButton";
import { isFromInteractiveElement } from "../../../utils/clipboard";
import { AssigneeChip } from "../../tasks/components/AssigneeChip";
import { DueDate } from "../../tasks/components/DueDate";
import { UnassignedBadge } from "../../tasks/components/UnassignedBadge";
import { isOverdue } from "../../tasks/lib/taskDates";
import { STATUS_LABEL, STATUS_VARIANT } from "../../tasks/lib/taskStatus";

import type { Task } from "../../tasks/types/taskTypes";

interface CalendarTaskCardProps {
  task: Task;
  // Today in IST ("YYYY-MM-DD"), passed in so every card agrees on "today"
  today: string;
  // True while a request for this card is in flight
  busy: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAssign: (task: Task) => void;
  // Opens the card's details: its full content and more
  onOpen: (task: Task) => void;
}

export function CalendarTaskCard({
  task,
  today,
  busy,
  onEdit,
  onDelete,
  onAssign,
  onOpen,
}: CalendarTaskCardProps) {
  const overdue = isOverdue(task, today);

  // What this person may do with this card comes with the card (once the
  // designer starts, the brief is fixed and all of these are false)
  const { can_edit: showEdit, can_delete: showDelete, can_assign: showAssign } =
    task.actions;

  return (
    <GlassCard
      // A click anywhere on the card opens it, except on the buttons inside.
      // Keyboard users use the title button.
      onClick={(event) => {
        if (!isFromInteractiveElement(event.target)) {
          onOpen(task);
        }
      }}
      className="flex h-full cursor-pointer flex-col gap-3 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">
          <button
            type="button"
            onClick={() => onOpen(task)}
            className="line-clamp-2 w-full text-left hover:underline focus-visible:underline"
          >
            {task.title}
          </button>
        </h3>
        <Badge variant={STATUS_VARIANT[task.status]} className="shrink-0">
          {STATUS_LABEL[task.status]}
        </Badge>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {task.content || <span className="italic">No content yet</span>}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{task.content_type.name}</Badge>

        {task.deadline && <DueDate deadline={task.deadline} overdue={overdue} />}

        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {task.assigned_to ? (
            <AssigneeChip name={task.assigned_to.name} />
          ) : (
            <UnassignedBadge />
          )}
        </span>
      </div>

      {(showEdit || showDelete || showAssign) && (
        // Pinned to the bottom, so the buttons line up across a row of cards
        // even when a neighbour has none
        <div className="-mb-1 mt-auto flex justify-end gap-1 border-t border-border pt-2">
          {showAssign && (
            <IconButton
              label={`Assign ${task.title}`}
              title={task.assigned_to ? "Change designer" : "Assign a designer"}
              disabled={busy}
              onClick={() => onAssign(task)}
            >
              <UserPlus className="size-4" aria-hidden="true" />
            </IconButton>
          )}
          {showEdit && (
            <IconButton
              label={`Edit ${task.title}`}
              title="Edit"
              disabled={busy}
              onClick={() => onEdit(task)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </IconButton>
          )}
          {showDelete && (
            <IconButton
              label={`Delete ${task.title}`}
              title="Delete"
              disabled={busy}
              onClick={() => onDelete(task)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </IconButton>
          )}
        </div>
      )}
    </GlassCard>
  );
}
