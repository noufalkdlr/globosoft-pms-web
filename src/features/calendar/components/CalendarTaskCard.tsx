import { Pencil, Trash2, UserPlus } from "lucide-react";

import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { isFromInteractiveElement } from "../../../utils/clipboard";
import { formatShortDate } from "../../../utils/date";
import { isOverdue } from "../../tasks/lib/taskDates";
import { STATUS_LABEL, STATUS_VARIANT } from "../../tasks/lib/taskStatus";

import type { Task } from "../../tasks/types/taskTypes";

const ICON_BUTTON_CLASS =
  "grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

interface CalendarTaskCardProps {
  task: Task;
  // Today in IST ("YYYY-MM-DD"), passed in so every card agrees on "today"
  today: string;
  // Whether the signed-in user may edit and delete cards
  canEdit: boolean;
  // Whether the signed-in user may choose the designer
  canAssign: boolean;
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
  canEdit,
  canAssign,
  busy,
  onEdit,
  onDelete,
  onAssign,
  onOpen,
}: CalendarTaskCardProps) {
  const overdue = isOverdue(task, today);

  // Once the designer starts, the brief is fixed: no editing, deleting or reassigning
  const isChangeable = task.status === "new" || task.status === "todo";
  const showEdit = canEdit && isChangeable;
  const showAssign = canAssign && isChangeable;

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

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Badge>{task.content_type.name}</Badge>

        {task.deadline && (
          <span
            className={
              overdue ? "text-xs text-destructive" : "text-xs text-muted-foreground"
            }
          >
            Due {formatShortDate(task.deadline)}
            {overdue && " (overdue)"}
          </span>
        )}

        <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {task.assigned_to ? (
            <>
              <Avatar name={task.assigned_to.name} size="sm" />
              {task.assigned_to.name}
            </>
          ) : (
            <Badge variant="danger">Unassigned</Badge>
          )}
        </span>
      </div>

      {(showEdit || showAssign) && (
        <div className="-mb-1 flex justify-end gap-1 border-t border-border pt-2">
          {showAssign && (
            <button
              type="button"
              aria-label={`Assign ${task.title}`}
              title={task.assigned_to ? "Change designer" : "Assign a designer"}
              disabled={busy}
              onClick={() => onAssign(task)}
              className={ICON_BUTTON_CLASS}
            >
              <UserPlus className="size-4" aria-hidden="true" />
            </button>
          )}
          {showEdit && (
            <>
              <button
                type="button"
                aria-label={`Edit ${task.title}`}
                title="Edit"
                disabled={busy}
                onClick={() => onEdit(task)}
                className={ICON_BUTTON_CLASS}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${task.title}`}
                title="Delete"
                disabled={busy}
                onClick={() => onDelete(task)}
                className={ICON_BUTTON_CLASS}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}
