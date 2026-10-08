import { useEffect } from "react";

const APP_NAME = "Globosoft PMS";

// Puts the page's name in the browser tab ("Board · Globosoft PMS"). It is also
// what a screen reader announces when the page changes, and what a person sees
// in the tab list or browser history.
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    // No title given: leave the tab as it is
    if (title) {
      document.title = `${title} · ${APP_NAME}`;
    }
  }, [title]);
}
