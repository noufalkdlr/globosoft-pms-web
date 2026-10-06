import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { formatShortDate } from "../../../utils/date";
import { STATUS_LABEL, STATUS_VARIANT } from "../../tasks/lib/taskStatus";

import type { Task } from "../../tasks/types/taskTypes";

interface CalendarTaskCardProps {
  task: Task;
  // Today in IST ("YYYY-MM-DD"), passed in so every card agrees on "today"
  today: string;
}

export function CalendarTaskCard({ task, today }: CalendarTaskCardProps) {
  const isOverdue =
    task.deadline !== null && task.deadline < today && task.status !== "done";

  return (
    <GlassCard className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-medium">{task.title}</h3>
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
              isOverdue ? "text-xs text-destructive" : "text-xs text-muted-foreground"
            }
          >
            Due {formatShortDate(task.deadline)}
            {isOverdue && " (overdue)"}
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
    </GlassCard>
  );
}
