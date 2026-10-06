import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  // Unique id per instance so the label always links to the right input
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-sm text-muted-foreground">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-xl border border-border bg-white/5 px-4 text-foreground outline-none transition",
          "placeholder:text-muted-foreground/60 focus:border-brand/60 focus:ring-4 focus:ring-brand/20",
          error && "border-destructive/60",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
