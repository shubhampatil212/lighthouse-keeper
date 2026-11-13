/** Where to put the arrow that points at a ship outside the screen. Pure math, unit-tested. */

export interface EdgeArrow {
  /** Arrow position on screen (CSS px). */
  x: number;
  y: number;
  /** Direction the arrow points (radians). */
  angle: number;
}

/** Extra room on each side (CSS px): the notch, the home bar and the HUD's bars. */
export interface ArrowEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const NO_EDGES: ArrowEdges = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * For a target at screen point (px, py): null if it's on screen, at least `margin` px inside the
 * edges (so it can be seen), otherwise
 * the point where the line from the island (cx, cy) to the target crosses a rectangle `inset` px inside
 * the screen edges (plus `edges` on each side).
 */
export function edgeArrow(
  width: number,
  height: number,
  cx: number,
  cy: number,
  px: number,
  py: number,
  inset: number,
  margin: number,
  edges: ArrowEdges = NO_EDGES,
): EdgeArrow | null {
  if (px >= margin && px <= width - margin && py >= margin && py <= height - margin) return null;
  const dx = px - cx;
  const dy = py - cy;
  const left = inset + edges.left;
  const right = width - inset - edges.right;
  const top = inset + edges.top;
  const bottom = height - inset - edges.bottom;
  let t = 1;
  if (dx > 0) t = Math.min(t, (right - cx) / dx);
  if (dx < 0) t = Math.min(t, (left - cx) / dx);
  if (dy > 0) t = Math.min(t, (bottom - cy) / dy);
  if (dy < 0) t = Math.min(t, (top - cy) / dy);
  t = Math.max(0, t);
  return { x: cx + dx * t, y: cy + dy * t, angle: Math.atan2(dy, dx) };
}
