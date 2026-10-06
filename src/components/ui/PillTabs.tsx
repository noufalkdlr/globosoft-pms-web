import { useRef, type KeyboardEvent } from "react";

import { cn } from "../../utils/cn";

interface PillTab<T extends string> {
  value: T;
  label: string;
}

interface PillTabsProps<T extends string> {
  tabs: PillTab<T>[];
  value: T;
  onChange: (value: T) => void;
  // Names the group for screen readers, e.g. "Client status"
  label: string;
  // Ties every tab to its panel. The panel needs id `${idPrefix}-panel` and
  // aria-labelledby `${idPrefix}-tab-${value}`.
  idPrefix: string;
  className?: string;
}

// Segmented control that follows the WAI-ARIA tabs pattern: arrow keys,
// Home and End move between tabs, and only the selected tab is in the Tab order.
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  idPrefix,
  className,
}: PillTabsProps<T>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.value === value);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    onChange(tabs[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex rounded-full border border-border bg-white/5 p-1",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.value === value;

        return (
          <button
            key={tab.value}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={`${idPrefix}-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition",
              isSelected
                ? "bg-brand/15 text-foreground ring-1 ring-brand/30"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
