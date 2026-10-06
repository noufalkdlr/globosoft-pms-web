import { cn } from "../../utils/cn";

type AvatarSize = "sm" | "md";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

// Initials avatar. Decorative: the person's name is always shown next to it.
export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-border bg-white/10 font-medium",
        SIZE_CLASS[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
