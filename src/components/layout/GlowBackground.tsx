import type { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

interface GlowBackgroundProps extends PropsWithChildren {
  className?: string;
}

// Full-height page wrapper with the soft red glow behind its content
export function GlowBackground({ className, children }: GlowBackgroundProps) {
  return (
    <div
      className={cn("relative isolate min-h-dvh overflow-hidden", className)}
    >
      {/* -z-10 keeps the glow behind the content inside this isolated stacking context */}
      <div className="pointer-events-none absolute -top-64 left-1/2 -z-10 h-[640px] w-[820px] -translate-x-1/2 rounded-full bg-brand/30 blur-[200px]" />
      {children}
    </div>
  );
}
