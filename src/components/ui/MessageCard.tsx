import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

interface MessageCardProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

// Centered card for empty, error and "nothing found" states
export function MessageCard({ title, description, action }: MessageCardProps) {
  return (
    <GlassCard className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button variant="glass" className="mt-3" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </GlassCard>
  );
}
