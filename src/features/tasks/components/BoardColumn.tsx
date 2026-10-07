import { useId } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { ChevronsLeft, ChevronsRight, UserX } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { cn } from "../../../utils/cn";
import { STATUS_LABEL } from "../lib/taskStatus";
import { BoardCard } from "./BoardCard";

import type { Task, TaskStatus } from "../types/taskTypes";

const DOT_CLASS: Record<TaskStatus, string> = {
  todo: "bg-muted-foreground/50",
  ongoing: "bg-brand",
  submitted: "bg-warning",
  fix: "bg-caution",
  done: "bg-success",
};

// The card list of a column scrolls inside itself once it is taller than this,
// so the board always fits the screen and the sideways scrollbar of the
// board stays in view (instead of sitting at the bottom of a very long page).
// The subtracted height is the page header, filters and column title above it.
const LIST_MAX_HEIGHT_CLASS =
  "max-h-[60dvh] md:max-h-[calc(100dvh-19rem)]";

// While a card is being dragged, every column says whether it can take it
export type DropState = "idle" | "allowed" | "blocked";

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  boardMonth: string;
  today: string;
  dropState: DropState;
  // The statuses this person may move a card to (empty = not draggable)
  getMoves: (task: Task) => TaskStatus[];
  // The card whose move is being saved, if any
  busyTaskId: number | undefined;
  onMove: (task: Task) => void;
  // Opens "Assign a designer" for a card. Omitted when this person cannot assign.
  onAssign?: (task: Task) => void;
  // Whether cards name their designer (not on a board of one's own cards)
  showAssignee?: boolean;
  // Opens a card's details
  onOpen: (task: Task) => void;
  // Only for the "Done" column, which can be folded into a narrow strip so the
  // columns that need attention have the room. A card can still be dropped on
  // the strip (approving it).
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

// One stage of the board with the cards that are in it
export function BoardColumn({
  status,
  tasks,
  boardMonth,
  today,
  dropState,
  getMoves,
  busyTaskId,
  onMove,
  onAssign,
  showAssignee = true,
  onOpen,
  collapsed = false,
  onToggleCollapsed,
}: BoardColumnProps) {
  const headingId = useId();
  // Cards in "To do" that still need a designer are said out loud in the heading
  const withoutDesigner =
    status === "todo" ? tasks.filter((task) => !task.assigned_to).length : 0;

  if (collapsed) {
    return (
      <section
        aria-labelledby={headingId}
        data-drop-state={dropState}
        className="w-14 shrink-0 snap-start rounded-3xl p-1.5"
      >
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "flex min-h-40 flex-col rounded-2xl border border-border bg-white/[0.03] transition",
                dropState === "allowed" && "border-brand/40 bg-brand/5",
                dropState === "allowed" &&
                  snapshot.isDraggingOver &&
                  "border-brand bg-brand/10 ring-1 ring-brand",
                dropState === "blocked" && "opacity-50",
              )}
            >
              <button
                type="button"
                aria-expanded="false"
                aria-label={`Show ${STATUS_LABEL[status]} cards (${tasks.length})`}
                title={`Show ${STATUS_LABEL[status]} cards`}
                onClick={onToggleCollapsed}
                className="flex flex-1 flex-col items-center gap-3 rounded-2xl px-1 py-4 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                <ChevronsLeft className="size-4" aria-hidden="true" />
                <Badge>{tasks.length}</Badge>
                <span
                  id={headingId}
                  className="flex items-center gap-2 font-medium [writing-mode:vertical-rl]"
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-2 rounded-full", DOT_CLASS[status])}
                  />
                  {STATUS_LABEL[status]}
                </span>
              </button>

              {/* Required by the drag and drop library; nothing to show */}
              <div className="hidden">{provided.placeholder}</div>
            </div>
          )}
        </Droppable>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      data-drop-state={dropState}
      // Narrow screens scroll sideways through fixed-width columns. From "sm"
      // up the columns share the row, never narrower than 13rem (the board
      // scrolls instead) and never wider than 22rem.
      className="@container w-[85vw] max-w-72 shrink-0 snap-start rounded-3xl p-2 sm:w-auto sm:min-w-52 sm:max-w-[22rem] sm:flex-1 sm:basis-0"
    >
      <header className="flex items-center justify-between gap-2 px-1.5 pb-3 pt-1">
        <h2
          id={headingId}
          className="flex items-center gap-2 whitespace-nowrap text-sm font-medium"
        >
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", DOT_CLASS[status])}
          />
          {STATUS_LABEL[status]}
        </h2>
        <span className="flex items-center gap-1.5">
          {withoutDesigner > 0 && (
            <Badge
              variant="warning"
              className="gap-1 whitespace-nowrap"
              title={`${withoutDesigner} without a designer`}
              aria-label={`${withoutDesigner} without a designer`}
            >
              <UserX className="size-3" aria-hidden="true" />
              {withoutDesigner}
              {/* The word only when the column is wide enough for it */}
              <span aria-hidden="true" className="hidden @min-[14rem]:inline">
                unassigned
              </span>
            </Badge>
          )}
          <Badge aria-label={`${tasks.length} cards`}>{tasks.length}</Badge>
          {onToggleCollapsed && (
            <button
              type="button"
              aria-expanded="true"
              aria-label={`Hide ${STATUS_LABEL[status]} cards`}
              title={`Hide ${STATUS_LABEL[status]} cards`}
              onClick={onToggleCollapsed}
              className="grid size-6 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
            >
              <ChevronsRight className="size-4" aria-hidden="true" />
            </button>
          )}
        </span>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            role="list"
            className={cn(
              "min-h-24 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white/[0.03] p-2 transition",
              LIST_MAX_HEIGHT_CLASS,
              dropState === "allowed" && "border-brand/40 bg-brand/5",
              dropState === "allowed" &&
                snapshot.isDraggingOver &&
                "border-brand bg-brand/10 ring-1 ring-brand",
              dropState === "blocked" && "opacity-50",
              dropState === "blocked" &&
                snapshot.isDraggingOver &&
                "border-destructive/60 bg-destructive/10",
            )}
          >
            {tasks.map((task, index) => {
              const moves = getMoves(task);
              const isBusy = busyTaskId === task.id;
              const canMove = moves.length > 0;

              return (
                <Draggable
                  key={task.id}
                  draggableId={String(task.id)}
                  index={index}
                  isDragDisabled={!canMove || isBusy}
                >
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      role="listitem"
                      className="mb-2.5"
                    >
                      <BoardCard
                        task={task}
                        boardMonth={boardMonth}
                        today={today}
                        dragHandleProps={dragProvided.dragHandleProps}
                        isDragging={dragSnapshot.isDragging}
                        onMove={canMove ? onMove : undefined}
                        // Whether this person may hand this card to a designer is
                        // the backend's call
                        onAssign={task.actions.can_assign ? onAssign : undefined}
                        showAssignee={showAssignee}
                        onOpen={onOpen}
                        busy={isBusy}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}

            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="px-1.5 py-6 text-center text-xs text-muted-foreground">
                Nothing here
              </p>
            )}
          </div>
        )}
      </Droppable>
    </section>
  );
}
