import { cn } from "../../utils/cn";

type ProgressTone = "brand" | "success" | "warning" | "danger";

interface ProgressBarProps {
  value: number;
  max: number;
  // Names what is measured, e.g. "Poster written"
  label: string;
  tone?: ProgressTone;
  className?: string;
}

const TONE_CLASS: Record<ProgressTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export function ProgressBar({
  value,
  max,
  label,
  tone = "brand",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", TONE_CLASS[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
