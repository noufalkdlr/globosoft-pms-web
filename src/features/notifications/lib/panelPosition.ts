import type { CSSProperties } from "react";

const MARGIN = 16;

// Where the panel goes: hanging from the bell, just below it, with its right
// edge under the bell's right edge. Worked out when the bell is clicked.
export function getPanelPosition(bell: DOMRect): CSSProperties {
  // The page width without a scrollbar, which is where `right` counts from
  const pageWidth = document.documentElement.clientWidth;

  return {
    right: Math.max(MARGIN, pageWidth - bell.right),
    top: bell.bottom + 8,
  };
}
