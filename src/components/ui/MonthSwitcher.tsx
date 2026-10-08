import { ChevronLeft, ChevronRight } from "lucide-react";

import { addMonths, formatMonth } from "../../utils/month";
import { Badge } from "./Badge";
import { IconButton } from "./IconButton";

// How far the calendar can be browsed
const MONTHS_BACK = 24;
const MONTHS_AHEAD = 24;

interface MonthSwitcherProps {
  month: string;
  currentMonth: string;
  onChange: (month: string) => void;
}

function getMonthNote(month: string, currentMonth: string) {
  if (month === addMonths(currentMonth, 1)) {
    return { label: "Planning next month", variant: "brand" as const };
  }

  if (month > currentMonth) {
    return { label: "Planning ahead", variant: "neutral" as const };
  }

  if (month < currentMonth) {
    return { label: "Past month", variant: "neutral" as const };
  }

  return null;
}

export function MonthSwitcher({
  month,
  currentMonth,
  onChange,
}: MonthSwitcherProps) {
  const note = getMonthNote(month, currentMonth);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <IconButton
          size={10}
          bordered
          label="Previous month"
          disabled={month <= addMonths(currentMonth, -MONTHS_BACK)}
          onClick={() => onChange(addMonths(month, -1))}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </IconButton>

        <p
          aria-live="polite"
          className="min-w-40 text-center text-lg font-semibold"
        >
          {formatMonth(month)}
        </p>

        <IconButton
          size={10}
          bordered
          label="Next month"
          disabled={month >= addMonths(currentMonth, MONTHS_AHEAD)}
          onClick={() => onChange(addMonths(month, 1))}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </IconButton>
      </div>

      {note && <Badge variant={note.variant}>{note.label}</Badge>}

      {month !== currentMonth && (
        <button
          type="button"
          onClick={() => onChange(currentMonth)}
          className="rounded-lg px-2.5 py-1 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          This month
        </button>
      )}
    </div>
  );
}
