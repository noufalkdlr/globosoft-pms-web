import {
  useEffect,
  useId,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "../../utils/cn";

interface ModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  // Buttons shown in the bottom row, e.g. Cancel and Save
  footer?: ReactNode;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open modals, topmost last. Only the topmost one reacts to Escape and Tab,
// so a confirm dialog opened over a form closes alone.
const modalStack: symbol[] = [];

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  className,
  children,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Always call the latest onClose without re-running the effect below
  // (which would steal focus on every parent render)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;
    const modalId = Symbol("modal");
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    modalStack.push(modalId);
    document.body.style.overflow = "hidden";

    // Prefer an explicitly marked field, then the first control in the body
    const initialFocus =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      panel;
    initialFocus?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (modalStack[modalStack.length - 1] !== modalId) {
        return;
      }

      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      // Keep keyboard focus inside the dialog
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      modalStack.splice(modalStack.indexOf(modalId), 1);
      document.body.style.overflow = previousOverflow;
      // Return focus to whatever opened the dialog
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "glass relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-3xl outline-none",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        {children && (
          <div ref={bodyRef} className="overflow-y-auto px-6 py-4">
            {children}
          </div>
        )}

        {footer && (
          <footer className="flex justify-end gap-3 px-6 pb-6 pt-2">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
