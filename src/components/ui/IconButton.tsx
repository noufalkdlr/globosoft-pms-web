import type { ComponentPropsWithRef } from "react";

import { cn } from "../../utils/cn";

const SIZE_CLASS = {
  6: "size-6",
  7: "size-7",
  8: "size-8",
  9: "size-9",
  10: "size-10",
} as const;

interface IconButtonProps extends Omit<ComponentPropsWithRef<"button">, "aria-label"> {
  // What the button does, for people who cannot see the icon. Required, because
  // an icon alone tells a screen reader nothing.
  label: string;
  // Width and height in Tailwind steps (6 = 24px ... 10 = 40px)
  size?: keyof typeof SIZE_CLASS;
  // A border and a faint fill, for a button that stands on its own (the month
  // arrows) rather than sitting in a row of actions
  bordered?: boolean;
}

// A round button with just an icon in it.
export function IconButton({
  label,
  size = 8,
  bordered = false,
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "grid place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground",
        SIZE_CLASS[size],
        bordered
          ? "border border-border bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          : "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
