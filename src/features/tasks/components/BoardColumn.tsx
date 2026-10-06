import { useId } from "react";

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

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  boardMonth: string;
  today: string;
}

// One stage of the board with the cards that are in it
export function BoardColumn({
  status,
  tasks,
  boardMonth,
  today,
}: BoardColumnProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="w-[85vw] max-w-72 shrink-0 snap-start rounded-3xl border border-border bg-white/[0.03] p-3 sm:w-72"
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

      {tasks.length === 0 ? (
        <p className="px-1.5 py-6 text-center text-xs text-muted-foreground">
          Nothing here
        </p>
      ) : (
        <ul className="space-y-2.5">
          {tasks.map((task) => (
            <li key={task.id}>
              <BoardCard task={task} boardMonth={boardMonth} today={today} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
