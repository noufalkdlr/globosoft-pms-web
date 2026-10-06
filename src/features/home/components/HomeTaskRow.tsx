import { Link } from "react-router";

import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { formatShortDate } from "../../../utils/date";
import { formatMonth } from "../../../utils/month";
import { isLate } from "../../tasks/lib/taskDates";
import { boardLinkFor } from "../../tasks/lib/taskLinks";
import { STATUS_LABEL, STATUS_VARIANT } from "../../tasks/lib/taskStatus";
import { getDueLabel } from "../lib/homeSections";

import type { Task } from "../../tasks/types/taskTypes";

interface HomeTaskRowProps {
  task: Task;
  currentMonth: string;
  today: string;
  showAssignee: boolean;
  // Shows the reviewer's note on cards sent back for correction
  showNote: boolean;
}

export function HomeTaskRow({
  task,
  currentMonth,
  today,
  showAssignee,
  showNote,
}: HomeTaskRowProps) {
  const due = getDueLabel(task, today);

  const note =
    showNote && task.status === "fix" && task.latest_review?.decision === "rejected"
      ? task.latest_review
      : null;

  return (
    <Link
      to={boardLinkFor(task, currentMonth)}
      className="block rounded-2xl px-3 py-2.5 transition hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {task.client.name}
          </p>
          <p className="truncate text-sm font-medium">{task.title}</p>
        </div>

        {due.date && (
          <span
            className={
              due.kind === "overdue"
                ? "shrink-0 text-xs text-destructive"
                : "shrink-0 text-xs text-muted-foreground"
            }
          >
            {due.kind === "today"
              ? "Due today"
              : due.kind === "overdue"
                ? `Overdue, ${formatShortDate(due.date)}`
                : `Due ${formatShortDate(due.date)}`}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={STATUS_VARIANT[task.status]}>
          {STATUS_LABEL[task.status]}
        </Badge>

        {isLate(task, currentMonth) && (
          <Badge variant="danger">Late from {formatMonth(task.month)}</Badge>
        )}

        {showAssignee &&
          (task.assigned_to ? (
            <span className="flex items-center gap-1.5">
              <Avatar name={task.assigned_to.name} size="sm" />
              {task.assigned_to.name}
            </span>
          ) : (
            <Badge variant="danger">Unassigned</Badge>
          ))}
      </div>

      {note && (
        <p className="mt-2 line-clamp-2 rounded-xl border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs">
          {note.comment}
        </p>
      )}
    </Link>
  );
}
