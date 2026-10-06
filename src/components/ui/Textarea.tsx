import { useId, type TextareaHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  id,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  // Unique ids so the label and the error message always link to this field
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={textareaId} className="text-sm text-muted-foreground">
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-24 w-full resize-y rounded-xl border border-border bg-white/5 px-4 py-3 text-foreground outline-none transition",
          "placeholder:text-muted-foreground/60 focus:border-brand/60 focus:ring-4 focus:ring-brand/20",
          error && "border-destructive/60",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
