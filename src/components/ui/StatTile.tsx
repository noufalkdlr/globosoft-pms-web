import { Link, type To } from "react-router";

import { cn } from "../../utils/cn";
import { GlassCard } from "./GlassCard";

interface StatTileProps {
  label: string;
  value: number | string;
  // A small line under the number, e.g. "right now"
  hint?: string;
  // Colours the number when it is above zero: "warning" (yellow) for work that
  // waits for someone, "danger" (red) only for what is overdue
  tone?: "warning" | "danger";
  // Makes the whole tile a link (the Home page's tiles open the board)
  href?: To;
}

// A number with a label.
export function StatTile({ label, value, hint, tone, href }: StatTileProps) {
  const isAboveZero = Number(value) > 0;

  const tile = (
    <GlassCard className={cn("p-4", href && "transition hover:bg-white/10")}>
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

  return href ? (
    <Link to={href} className="block">
      {tile}
    </Link>
  ) : (
    tile
  );
}
