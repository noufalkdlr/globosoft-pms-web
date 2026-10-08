import { MessageSquareWarning } from "lucide-react";

import { cn } from "../../../utils/cn";

import type { Task } from "../types/taskTypes";

type Review = NonNullable<Task["latest_review"]>;

interface CorrectionNoteProps {
  review: Review;
  // "card": on a board card. "details": in the card's details, with a heading.
  // "line": just the comment, for a list.
  variant: "card" | "details" | "line";
}

// What the reviewer asked to be fixed when a card was sent back. Orange: it
// needs fixing, which is not the same as late (red).
export function CorrectionNote({ review, variant }: CorrectionNoteProps) {
  const box = "rounded-xl border border-caution/30 bg-caution/10";

  if (variant === "line") {
    return (
      <p className={cn(box, "mt-2 line-clamp-2 px-2.5 py-1.5 text-xs")}>{review.comment}</p>
    );
  }

  const isDetails = variant === "details";

  return (
    <div className={cn(box, "flex", isDetails ? "gap-2.5 p-3 text-sm" : "gap-2 p-2.5 text-xs")}>
      <MessageSquareWarning
        className={cn("shrink-0 text-caution", isDetails ? "mt-0.5 size-4" : "mt-0.5 size-3.5")}
        aria-hidden="true"
      />
      <div className="min-w-0">
        {isDetails ? (
          <>
            <p className="font-medium">What to fix</p>
            <p className="mt-1 whitespace-pre-wrap break-words">{review.comment}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{review.reviewer.name}</p>
          </>
        ) : (
          <>
            <p className="line-clamp-3">{review.comment}</p>
            <p className="mt-1 text-muted-foreground">{review.reviewer.name}</p>
          </>
        )}
      </div>
    </div>
  );
}
