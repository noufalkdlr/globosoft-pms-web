import { Link } from "react-router";

import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { formatShortDate } from "../../../utils/date";
import { formatMonth, formatMonthShort } from "../../../utils/month";
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
  // False in a list where every card has the same status: the list's title says it
  showStatus: boolean;
  // Shows the reviewer's note on cards sent back for correction
  showNote: boolean;
}

export function HomeTaskRow({
  task,
  currentMonth,
  today,
  showAssignee,
  showStatus,
  showNote,
}: HomeTaskRowProps) {
  const due = getDueLabel(task, today);
  // An overdue card says so in red already; "Late" adds something only for
  // carried-over work that is not overdue
  const showLate = isLate(task, currentMonth) && due.kind !== "overdue";
  const hasChips = showStatus || showLate || showAssignee;

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
                : due.kind === "today" || due.kind === "soon"
                  ? "shrink-0 text-xs text-warning"
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

      {hasChips && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {showStatus && (
            <Badge variant={STATUS_VARIANT[task.status]}>
              {STATUS_LABEL[task.status]}
            </Badge>
          )}

          {showLate && (
            <Badge variant="danger" title={`Late from ${formatMonth(task.month)}`}>
              Late · {formatMonthShort(task.month)}
            </Badge>
          )}

          {showAssignee &&
            (task.assigned_to ? (
              <span className="flex items-center gap-1.5">
                <Avatar name={task.assigned_to.name} size="sm" />
                {task.assigned_to.name}
              </span>
            ) : (
              <Badge variant="warning">Unassigned</Badge>
            ))}
        </div>
      )}

      {note && (
        <p className="mt-2 line-clamp-2 rounded-xl border border-caution/30 bg-caution/10 px-2.5 py-1.5 text-xs">
          {note.comment}
        </p>
      )}
    </Link>
  );
}
