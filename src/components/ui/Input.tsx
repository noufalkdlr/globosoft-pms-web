import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Omit the label for compact uses (e.g. inside a table row) and pass aria-label instead
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  // Unique ids so the label and the error message always link to this field
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-muted-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-12 w-full rounded-xl border border-border bg-white/5 px-4 text-foreground outline-none transition",
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
