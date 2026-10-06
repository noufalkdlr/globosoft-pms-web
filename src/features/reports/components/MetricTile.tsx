import { GlassCard } from "../../../components/ui/GlassCard";
import { cn } from "../../../utils/cn";

interface MetricTileProps {
  label: string;
  value: string | number;
  // A small line under the number, e.g. "right now"
  hint?: string;
  // Makes the number red when it is above zero (something needs action)
  attention?: boolean;
}

export function MetricTile({ label, value, hint, attention = false }: MetricTileProps) {
  const needsAttention = attention && Number(value) > 0;

  return (
    <GlassCard className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          needsAttention && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </GlassCard>
  );
}
