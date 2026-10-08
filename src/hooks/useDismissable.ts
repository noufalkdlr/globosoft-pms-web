import { useEffect, useRef, type RefObject } from "react";

interface DismissableOptions {
  // Listen only while something is open
  enabled?: boolean;
  // Where focus goes back to after Escape, so a keyboard user keeps their place
  returnFocusTo?: RefObject<HTMLElement | null>;
  // Also close when the window gets narrower or wider (a position worked out for
  // one width would drift). A change of height does not count: a phone's address
  // bar showing or hiding must not close anything.
  closeOnWidthChange?: boolean;
}

// The ways out of a box that opens over the page (a menu, a list from a bell):
// Escape, and a click anywhere outside it. `inside` are the elements that count
// as "in" it: the box itself and the button that opens it.
export function useDismissable(
  inside: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  { enabled = true, returnFocusTo, closeOnWidthChange = false }: DismissableOptions = {},
) {
  // The latest values, read when an event happens, so the listeners are not
  // taken off and put back on at every render
  const latest = useRef({ inside, onDismiss, returnFocusTo });

  // After every render, never during one: refs are not for reading or writing
  // while a component is being drawn
  useEffect(() => {
    latest.current = { inside, onDismiss, returnFocusTo };
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        latest.current.onDismiss();
        latest.current.returnFocusTo?.current?.focus();
      }
    }

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!latest.current.inside.some((ref) => ref.current?.contains(target))) {
        latest.current.onDismiss();
      }
    }

    let width = window.innerWidth;

    function handleResize() {
      if (window.innerWidth !== width) {
        width = window.innerWidth;
        latest.current.onDismiss();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    if (closeOnWidthChange) {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [enabled, closeOnWidthChange]);
}
