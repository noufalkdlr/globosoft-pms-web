import type { HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "caution" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  neutral: "border-border bg-white/5 text-muted-foreground",
  brand: "border-brand/30 bg-brand/15 text-foreground",
  success: "border-success/30 bg-success/15 text-success",
  // Waiting for a person to act
  warning: "border-warning/30 bg-warning/10 text-warning",
  // Needs fixing
  caution: "border-caution/30 bg-caution/15 text-caution",
  // Late, overdue, wrong
  danger: "border-destructive/30 bg-destructive/15 text-destructive",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
