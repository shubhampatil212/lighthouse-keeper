/** Dashed outlines (Pixi has no dashed stroke). Pure math, so it can be unit-tested. */
import type { Point } from './art/types';

/**
 * Splits a closed outline into dashes: returns [x0, y0, x1, y1] for each dash. The pattern carries on
 * across corners, so the dashes keep an even rhythm all the way round.
 */
export function dashOutline(
  points: readonly Point[],
  dash: number,
  gap: number,
): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  if (points.length < 2 || dash <= 0) return out;
  const period = dash + gap;
  let phase = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (!a || !b) continue;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length === 0) continue;
    const ux = (b.x - a.x) / length;
    const uy = (b.y - a.y) / length;
    let s = 0;
    while (s < length) {
      const inDash = phase < dash;
      const left = inDash ? dash - phase : period - phase;
      const step = Math.min(left, length - s);
      if (inDash)
        out.push([a.x + ux * s, a.y + uy * s, a.x + ux * (s + step), a.y + uy * (s + step)]);
      s += step;
      phase = (phase + step) % period;
    }
  }
  return out;
}
