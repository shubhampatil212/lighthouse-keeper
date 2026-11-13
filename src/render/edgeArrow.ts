/** Where to put the arrow that points at a ship outside the screen. Pure math, unit-tested. */

export interface EdgeArrow {
  /** Arrow position on screen (CSS px). */
  x: number;
  y: number;
  /** Direction the arrow points (radians). */
  angle: number;
}

/**
 * For a target at screen point (px, py): null if it's on screen, at least `margin` px inside the
 * edges (so it can be seen), otherwise
 * the point where the line from the island (cx, cy) to the target crosses a rectangle `inset` px inside
 * the screen edges.
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
): EdgeArrow | null {
  if (px >= margin && px <= width - margin && py >= margin && py <= height - margin) return null;
  const dx = px - cx;
  const dy = py - cy;
  const left = inset;
  const right = width - inset;
  const top = inset;
  const bottom = height - inset;
  let t = 1;
  if (dx > 0) t = Math.min(t, (right - cx) / dx);
  if (dx < 0) t = Math.min(t, (left - cx) / dx);
  if (dy > 0) t = Math.min(t, (bottom - cy) / dy);
  if (dy < 0) t = Math.min(t, (top - cy) / dy);
  t = Math.max(0, t);
  return { x: cx + dx * t, y: cy + dy * t, angle: Math.atan2(dy, dx) };
}
