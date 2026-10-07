import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

import { cn } from "../../utils/cn";
import {
  useToastStore,
  type ToastItem,
  type ToastVariant,
} from "../../stores/toastStore";

import type { LucideIcon } from "lucide-react";

const ICON: Record<ToastVariant, LucideIcon> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

const ICON_CLASS: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-destructive",
  info: "text-muted-foreground",
};

// Errors stay longer: they usually say why something did not work, and that
// takes longer to read than "Saved".
const DURATION_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  error: 7000,
};

// One toast. It goes away by itself, but not while the pointer is over it or
// something inside it has keyboard focus, so it can be read in peace.
function Toast({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const [isPaused, setIsPaused] = useState(false);
  const Icon = ICON[item.variant];

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timer = setTimeout(() => dismiss(item.id), DURATION_MS[item.variant]);

    return () => clearTimeout(timer);
  }, [isPaused, item.id, item.variant, dismiss]);

  return (
    <div
      // An error interrupts a screen reader, the rest wait their turn
      role={item.variant === "error" ? "alert" : "status"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="glass pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl py-3 pl-4 pr-3 text-sm"
    >
      <Icon
        className={cn("size-5 shrink-0", ICON_CLASS[item.variant])}
        aria-hidden="true"
      />
      <span>{item.message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismiss(item.id)}
        className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// Renders the active toasts. Mount it once, near the root of the app.
export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    // bottom-28 on mobile keeps toasts clear of the floating bottom bar
    <div className="pointer-events-none fixed inset-x-4 bottom-28 z-[60] flex flex-col items-center gap-2 md:bottom-6">
      {toasts.map((item) => (
        <Toast key={item.id} item={item} />
      ))}
    </div>
  );
}
