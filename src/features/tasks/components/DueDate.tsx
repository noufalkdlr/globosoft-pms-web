import { formatShortDate } from "../../../utils/date";

interface DueDateProps {
  deadline: string;
  overdue: boolean;
}

// "Due 10 Oct", in red with "(overdue)" once the day has passed.
export function DueDate({ deadline, overdue }: DueDateProps) {
  return (
    <span className={overdue ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
      Due {formatShortDate(deadline)}
      {overdue && " (overdue)"}
    </span>
  );
}
