import { useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "../../utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  // Omit the label for compact uses (e.g. table rows) and pass aria-label instead
  label?: string;
  error?: string;
}

// Native <select> with the app's styling. The browser's own dropdown keeps
// full keyboard, screen reader and mobile support for free.
export function Select({
  label,
  error,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm text-muted-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 w-full appearance-none rounded-xl border border-border bg-white/5 pl-4 pr-10 text-foreground outline-none transition",
            "focus:border-brand/60 focus:ring-4 focus:ring-brand/20",
            // Keep the native dropdown list readable on dark surfaces
            "*:bg-surface *:text-foreground",
            error && "border-destructive/60",
            className,
          )}
          {...props}
        >
          {children}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>

      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
