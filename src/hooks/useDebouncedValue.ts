import { useEffect, useState } from "react";

// Returns `value` only after it has stopped changing for `delayMs`.
// Used so a search box does not hit the API on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
