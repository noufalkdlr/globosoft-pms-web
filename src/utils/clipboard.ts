// Puts text on the clipboard. Returns false when the browser refuses (some
// browsers do, for example on a page that is not secure), so the caller can
// tell the person to copy by hand instead of pretending it worked.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
}

// True when a click landed on a button, link or form field. A card that opens
// on click uses this to leave the controls inside it alone.
export function isFromInteractiveElement(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('a, button, input, select, textarea, label, [role="button"]') !== null
  );
}
