import { useId } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";

import { Badge } from "../../../components/ui/Badge";
import { cn } from "../../../utils/cn";
import { STATUS_LABEL } from "../lib/taskStatus";
import { BoardCard } from "./BoardCard";

import type { Task, TaskStatus } from "../types/taskTypes";

const DOT_CLASS: Record<TaskStatus, string> = {
  new: "bg-muted-foreground/50",
  todo: "bg-muted-foreground/50",
  ongoing: "bg-brand",
  submitted: "bg-warning",
  fix: "bg-destructive",
  done: "bg-success",
};

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
}: BoardColumnProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      data-drop-state={dropState}
      className="w-[85vw] max-w-72 shrink-0 snap-start rounded-3xl p-3 sm:w-72"
    >
      <header className="flex items-center justify-between gap-2 px-1.5 pb-3 pt-1">
        <h2 id={headingId} className="flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", DOT_CLASS[status])}
          />
          {STATUS_LABEL[status]}
        </h2>
        <Badge aria-label={`${tasks.length} cards`}>{tasks.length}</Badge>
      </header>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            role="list"
            className={cn(
              "min-h-24 rounded-2xl border border-border bg-white/[0.03] p-2 transition",
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
