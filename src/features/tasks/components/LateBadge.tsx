import { Badge } from "../../../components/ui/Badge";
import { formatMonth, formatMonthShort } from "../../../utils/month";

interface LateBadgeProps {
  // The month the card was meant for
  month: string;
  // Spell it out ("Late from September 2026") where there is room
  long?: boolean;
}

// Work carried over from an earlier month that is not finished.
export function LateBadge({ month, long = false }: LateBadgeProps) {
  const full = `Late from ${formatMonth(month)}`;

  return (
    <Badge variant="danger" title={long ? undefined : full}>
      {long ? full : `Late · ${formatMonthShort(month)}`}
    </Badge>
  );
}
