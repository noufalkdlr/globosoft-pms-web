import { GlassCard } from "../../../components/ui/GlassCard";
import { cn } from "../../../utils/cn";

interface MetricTileProps {
  label: string;
  value: string | number;
  // A small line under the number, e.g. "right now"
  hint?: string;
  // Colours the number when it is above zero: "warning" (yellow) for work that
  // waits for someone, "danger" (red) only for what is overdue
  tone?: "warning" | "danger";
}

export function MetricTile({ label, value, hint, tone }: MetricTileProps) {
  const isAboveZero = Number(value) > 0;

  return (
    <GlassCard className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          isAboveZero && tone === "warning" && "text-warning",
          isAboveZero && tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </GlassCard>
  );
}
