import { ArrowRightLeft, ExternalLink, GripVertical, UserPlus } from "lucide-react";

import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { IconButton } from "../../../components/ui/IconButton";
import { cn } from "../../../utils/cn";
import { isFromInteractiveElement } from "../../../utils/clipboard";
import { isLate, isOverdue, isSafeLink } from "../lib/taskDates";
import { AssigneeChip } from "./AssigneeChip";
import { CorrectionNote } from "./CorrectionNote";
import { DueDate } from "./DueDate";
import { LateBadge } from "./LateBadge";
import { UnassignedBadge } from "./UnassignedBadge";

import type { Task } from "../types/taskTypes";

interface BoardCardProps {
  task: Task;
  // The month the board is showing, to tell which cards are late
  boardMonth: string;
  // Today in IST ("YYYY-MM-DD"), passed in so every card agrees on "today"
  today: string;
  // Props for the drag handle, or null when this person cannot move the card
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  isDragging: boolean;
  // Opens "Move to…". Omitted when this person cannot move the card.
  onMove?: (task: Task) => void;
  // Opens "Assign a designer". Omitted when this person cannot assign the card.
  onAssign?: (task: Task) => void;
  // False on a board that only holds this person's own cards: their own name on
  // every card says nothing
  showAssignee?: boolean;
  // Opens the card's details: its full content, deadline, designer and more
  onOpen: (task: Task) => void;
  // True while a move of this card is being saved
  busy: boolean;
}

export function BoardCard({
  task,
  boardMonth,
  today,
  dragHandleProps,
  isDragging,
  onMove,
  onAssign,
  showAssignee = true,
  onOpen,
  busy,
}: BoardCardProps) {
  const late = isLate(task, boardMonth);
  const overdue = isOverdue(task, today);

  // A card sent back for correction carries the reviewer's note
  const note =
    task.status === "fix" && task.latest_review?.decision === "rejected"
      ? task.latest_review
      : null;

  return (
    <GlassCard
      // A click anywhere on the card opens it, except on the controls inside
      // (drag handle, links, buttons). Keyboard users use the title button.
      onClick={(event) => {
        if (!isFromInteractiveElement(event.target)) {
          onOpen(task);
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-2.5 p-3.5",
        isDragging && "ring-2 ring-brand/70 shadow-brand-glow",
        busy && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          {dragHandleProps ? (
            // Dragging starts here, not on the whole card, so the links and
            // buttons inside the card stay ordinary controls
            <div
              {...dragHandleProps}
              aria-label={`Drag ${task.title}`}
              className="-ml-1.5 grid size-7 shrink-0 cursor-grab place-items-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </div>
          ) : (
            // A card this person cannot move keeps the handle's space, so the
            // client names line up down the whole column
            <span aria-hidden="true" className="-ml-1.5 size-7 shrink-0" />
          )}
          <p className="truncate text-xs text-muted-foreground">
            {task.client.name}
          </p>
        </div>
      </div>

      <h3 className="text-sm font-medium">
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="line-clamp-2 w-full text-left hover:underline focus-visible:underline"
        >
          {task.title}
        </button>
      </h3>

      {note && <CorrectionNote review={note} variant="card" />}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <Badge>{task.content_type.name}</Badge>

        {/* An overdue card already says so in red below; "Late" is for work carried
            over from an earlier month that is not overdue (no deadline, say) */}
        {late && !overdue && <LateBadge month={task.month} />}

        {task.deadline && <DueDate deadline={task.deadline} overdue={overdue} />}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {task.assigned_to ? (
          showAssignee ? (
            // In a narrow column only the avatar shows (see AssigneeChip)
            <AssigneeChip name={task.assigned_to.name} hideNameWhenNarrow />
          ) : null
        ) : onAssign ? (
          // The card cannot start until it has a designer, so the way to give
          // it one is right here
          <button
            type="button"
            disabled={busy}
            onClick={() => onAssign(task)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning transition hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="size-3.5" aria-hidden="true" />
            Assign designer
            <span className="sr-only">for {task.title}</span>
          </button>
        ) : (
          <UnassignedBadge />
        )}

        <span className="ml-auto flex shrink-0 items-center gap-2">
          {isSafeLink(task.file_link) && (
            <a
              href={task.file_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              Design
              <ExternalLink className="size-3" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}

          {onAssign && task.assigned_to && (
            <IconButton
              size={7}
              label={`Change designer of ${task.title}`}
              title="Change designer"
              disabled={busy}
              onClick={() => onAssign(task)}
            >
              <UserPlus className="size-3.5" aria-hidden="true" />
            </IconButton>
          )}

          {onMove && (
            <IconButton
              size={7}
              label={`Move ${task.title}`}
              title="Move to…"
              disabled={busy}
              onClick={() => onMove(task)}
            >
              <ArrowRightLeft className="size-3.5" aria-hidden="true" />
            </IconButton>
          )}
        </span>
      </div>
    </GlassCard>
  );
}
