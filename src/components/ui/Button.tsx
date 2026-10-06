import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

type Variant = "brand" | "glass" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT: Record<Variant, string> = {
  // Primary action with a red glow
  brand:
    "bg-brand text-brand-foreground shadow-brand-glow hover:shadow-brand-glow-strong",
  // Secondary action on a glass surface
  glass: "glass text-foreground hover:bg-white/10",
  // Low-emphasis action
  ghost: "bg-transparent text-foreground hover:bg-white/5",
};

export function Button({
  variant = "brand",
  fullWidth,
  loading,
  disabled,
  className,
  children,
  // A bare <button> inside a form submits it. Default to "button" so only a
  // button that says type="submit" can do that.
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      // Block clicks while loading to prevent double submits
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
