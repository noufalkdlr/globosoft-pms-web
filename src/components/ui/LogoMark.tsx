import { cn } from "../../utils/cn";

interface LogoMarkProps {
  className?: string;
}

// Placeholder mark: swap for the real company logo
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <div
      className={cn(
        "grid size-9 place-items-center rounded-xl bg-brand text-sm font-semibold text-brand-foreground shadow-brand-glow",
        className,
      )}
    >
      G
    </div>
  );
}
