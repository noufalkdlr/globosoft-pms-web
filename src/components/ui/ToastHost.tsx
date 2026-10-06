import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

import { cn } from "../../utils/cn";
import { useToastStore, type ToastVariant } from "../../stores/toastStore";

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

// Renders the active toasts. Mount it once, near the root of the app.
export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    // bottom-28 on mobile keeps toasts clear of the floating bottom bar
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-28 z-[60] flex flex-col items-center gap-2 md:bottom-6"
    >
      {toasts.map((item) => {
        const Icon = ICON[item.variant];

        return (
          <div
            key={item.id}
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
      })}
    </div>
  );
}
