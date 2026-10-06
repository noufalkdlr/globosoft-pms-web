import { Link } from "react-router";

import { GlassCard } from "../../../components/ui/GlassCard";
import { ROUTES } from "../../../lib/routes";
import { cn } from "../../../utils/cn";

interface StatTileProps {
  label: string;
  value: number;
  // Makes the number red when it is above zero (something needs action)
  attention?: boolean;
}

// A number with a label that opens the board
export function StatTile({ label, value, attention = false }: StatTileProps) {
  return (
    <Link to={ROUTES.board} className="block">
      <GlassCard className="p-4 transition hover:bg-white/10">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "mt-1 block text-2xl font-semibold tabular-nums",
            attention && value > 0 && "text-destructive",
          )}
        >
          {value}
        </span>
      </GlassCard>
    </Link>
  );
}
