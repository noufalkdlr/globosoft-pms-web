import { Badge } from "../../../components/ui/Badge";
import { GlassCard } from "../../../components/ui/GlassCard";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { PROGRESS_TONE, getProgressState } from "../lib/progress";

import type { TypeProgress } from "../types/overviewTypes";

interface TypeProgressCardProps {
  progress: TypeProgress;
}

// One content type of one client for the month: written against the target,
// and what is left to deliver. "Waiting for content" and "to design" are
// shown apart so a designer is never blamed for content that was not written.
export function TypeProgressCard({ progress }: TypeProgressCardProps) {
  const name = progress.content_type.name;
  const state = getProgressState(progress.written, progress.target);

  return (
    <GlassCard className="h-full space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{name}</h3>
        {progress.extra > 0 && (
          <Badge variant="brand">Extra +{progress.extra}</Badge>
        )}
      </div>

      {progress.target > 0 ? (
        <>
          <ProgressBar
            label={`${name} written`}
            value={progress.written}
            max={progress.target}
            tone={PROGRESS_TONE[state]}
          />

          <div className="space-y-1 text-sm">
            <p>
              {progress.written} of {progress.target} written
              {progress.to_write > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  ({progress.to_write} to write)
                </span>
              )}
            </p>
            <p className="text-muted-foreground">
              {progress.done} of {progress.target} delivered
              {progress.delivery_remaining > 0 &&
                `. ${progress.to_write} waiting for content, ${progress.to_design} to design`}
            </p>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {progress.written} written, not in this month's plan
        </p>
      )}
    </GlassCard>
  );
}
