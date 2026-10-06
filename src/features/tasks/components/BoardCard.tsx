import { ExternalLink, MessageSquareWarning } from "lucide-react";

import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { formatShortDate } from "../../../utils/date";
import { formatMonth } from "../../../utils/month";
import { isLate, isOverdue, isSafeLink } from "../lib/taskDates";

import type { Task } from "../types/taskTypes";

interface BoardCardProps {
  task: Task;
  // The month the board is showing, to tell which cards are late
  boardMonth: string;
  // Today in IST ("YYYY-MM-DD"), passed in so every card agrees on "today"
  today: string;
}

export function BoardCard({ task, boardMonth, today }: BoardCardProps) {
  const late = isLate(task, boardMonth);
  const overdue = isOverdue(task, today);

  // A card sent back for correction carries the reviewer's note
  const note =
    task.status === "fix" && task.latest_review?.decision === "rejected"
      ? task.latest_review
      : null;

  return (
    <GlassCard className="flex flex-col gap-2.5 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">
          {task.client.name}
        </p>
        {late && (
          <Badge variant="danger" className="shrink-0">
            Late from {formatMonth(task.month)}
          </Badge>
        )}
      </div>

      <h3 className="line-clamp-2 text-sm font-medium">{task.title}</h3>

      {note && (
        <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs">
          <MessageSquareWarning
            className="mt-0.5 size-3.5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="line-clamp-3">{note.comment}</p>
            <p className="mt-1 text-muted-foreground">{note.reviewer.name}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
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
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {task.assigned_to ? (
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={task.assigned_to.name} size="sm" />
            <span className="truncate">{task.assigned_to.name}</span>
          </span>
        ) : (
          <Badge variant="danger">Unassigned</Badge>
        )}

        {isSafeLink(task.file_link) && (
          <a
            href={task.file_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 underline underline-offset-2 hover:text-foreground"
          >
            Design
            <ExternalLink className="size-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </GlassCard>
  );
}
