import type { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface GlowBackgroundProps extends PropsWithChildren {
  className?: string;
}

// Full-height page wrapper with the soft red glows behind its content
export function GlowBackground({ className, children }: GlowBackgroundProps) {
  return (
    <div
      // overflow-clip, not overflow-hidden: both cut off the glow, but "hidden"
      // would stop the header inside from sticking to the top of the window
      className={cn("relative isolate min-h-dvh overflow-clip", className)}
    >
      {/* Two glows, one in the top-left corner and one in the bottom-right, fixed to the window
          so the bottom one stays in view on long pages. -z-10 keeps them behind the content
          inside this isolated stacking context. */}
      <div className="pointer-events-none fixed -left-80 -top-80 -z-10 size-[820px] rounded-full bg-brand/20 blur-[240px]" />
      <div className="pointer-events-none fixed -bottom-80 -right-80 -z-10 size-[820px] rounded-full bg-brand/20 blur-[240px]" />
      {children}
    </div>
  );
}
