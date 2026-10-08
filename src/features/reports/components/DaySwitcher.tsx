import { ChevronLeft, ChevronRight } from "lucide-react";

import { IconButton } from "../../../components/ui/IconButton";
import { addDaysToIsoDate, formatLongDate } from "../../../utils/date";

interface DaySwitcherProps {
  date: string;
  today: string;
  onChange: (date: string) => void;
}

// Pick the day a daily report is about: step back and forth, or type a date.
// Days that have not happened yet are not offered.
export function DaySwitcher({ date, today, onChange }: DaySwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <IconButton
          size={10}
          bordered
          label="Previous day"
          onClick={() => onChange(addDaysToIsoDate(date, -1))}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </IconButton>

        <p aria-live="polite" className="min-w-56 text-center text-base font-semibold">
          {formatLongDate(date)}
        </p>

        <IconButton
          size={10}
          bordered
          label="Next day"
          disabled={date >= today}
          onClick={() => onChange(addDaysToIsoDate(date, 1))}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </IconButton>
      </div>

      <input
        type="date"
        aria-label="Report date"
        value={date}
        max={today}
        onChange={(event) => {
          // Clearing the field gives "": ignore it and keep the current day
          if (event.target.value) {
            onChange(event.target.value);
          }
        }}
        className="h-10 rounded-xl border border-border bg-white/5 px-3 text-sm text-foreground outline-none focus:border-brand/60 focus:ring-4 focus:ring-brand/20"
      />

      {date !== today && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="rounded-lg px-2.5 py-1 text-sm font-medium text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        >
          Today
        </button>
      )}
    </div>
  );
}
