import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDaysToIsoDate, formatLongDate } from "../../../utils/date";

const ARROW_BUTTON_CLASS =
  "grid size-10 place-items-center rounded-full border border-border bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40";

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
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => onChange(addDaysToIsoDate(date, -1))}
          className={ARROW_BUTTON_CLASS}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <p aria-live="polite" className="min-w-56 text-center text-base font-semibold">
          {formatLongDate(date)}
        </p>

        <button
          type="button"
          aria-label="Next day"
          disabled={date >= today}
          onClick={() => onChange(addDaysToIsoDate(date, 1))}
          className={ARROW_BUTTON_CLASS}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
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
