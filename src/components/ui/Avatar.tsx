import { useState } from "react";

import { cn } from "../../utils/cn";

type AvatarSize = "sm" | "md";

interface AvatarProps {
  name: string;
  // The person's picture. Missing, or a picture that does not load, falls back
  // to their initials.
  src?: string | null;
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

// A person's picture, or their initials. Decorative: the person's name is
// always shown next to it.
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  // Remembers which address failed, so a new picture gets a fresh try
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPicture = Boolean(src) && src !== failedSrc;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-white/10 font-medium",
        SIZE_CLASS[size],
        className,
      )}
    >
      {showPicture ? (
        <img
          src={src ?? undefined}
          alt=""
          // Google's picture servers refuse some requests that carry a referrer
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailedSrc(src ?? null)}
          className="size-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
