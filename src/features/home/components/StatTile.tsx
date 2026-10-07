import { Link } from "react-router";

import { GlassCard } from "../../../components/ui/GlassCard";
import { ROUTES } from "../../../lib/routes";
import { cn } from "../../../utils/cn";

interface StatTileProps {
  label: string;
  value: number;
  // Colours the number when it is above zero: "warning" (yellow) for work that
  // waits for this person, "danger" (red) only for what is overdue
  tone?: "warning" | "danger";
}

// A number with a label that opens the board
export function StatTile({ label, value, tone }: StatTileProps) {
  return (
    <Link to={ROUTES.board} className="block">
      <GlassCard className="p-4 transition hover:bg-white/10">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "mt-1 block text-2xl font-semibold tabular-nums",
            value > 0 && tone === "warning" && "text-warning",
            value > 0 && tone === "danger" && "text-destructive",
          )}
        >
          {value}
        </span>
      </GlassCard>
    </Link>
  );
}
