import type { CSSProperties } from "react";

export type BellPlacement = "side" | "top";

const MARGIN = 16;

// Where the panel goes, next to the bell: to its right for the sidebar's bell,
// below it for the one in the top bar. Worked out when the bell is clicked.
export function getPanelPosition(
  bell: DOMRect,
  placement: BellPlacement,
): CSSProperties {
  return placement === "side"
    ? { left: bell.right + 12, top: Math.max(MARGIN, bell.top) }
    : { right: MARGIN, top: bell.bottom + 8 };
}
