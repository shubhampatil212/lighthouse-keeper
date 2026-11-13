/**
 * Low-poly rock outlines from a seed: the same seed and radius always give the same rock, so a reef
 * looks the same every night and can be learned. Pure math (no Pixi) so it can be unit-tested.
 */
import { createRng } from '../../sim/rng';
import type { Point, RockShape } from './types';

/** Rocks are seen from above at an angle, so they're drawn a little shorter than wide. */
export const ROCK_SQUASH = 0.85;

export function rockShape(seed: number, r: number): RockShape {
  const rng = createRng(seed);
  const count = rng.int(6, 8);
  const step = (Math.PI * 2) / count;
  const start = rng.range(0, step);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const a = start + i * step + rng.range(-0.25, 0.25) * step;
    const d = r * rng.range(0.8, 1.08);
    points.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * ROCK_SQUASH });
  }
  const peak = { x: rng.range(-0.25, 0.25) * r, y: rng.range(-0.35, -0.1) * r };
  return { points, peak };
}

/** A stable seed for one rock of a level. */
export function rockSeed(levelSeed: number, rockIndex: number): number {
  return (Math.imul(levelSeed >>> 0, 0x9e3779b1) ^ Math.imul(rockIndex + 1, 0x85ebca6b)) >>> 0;
}

/**
 * Brightness (0–1) of the facet between the peak and the edge a→b, lit from direction `light`.
 * Facets facing the light and facing up the screen are brighter.
 */
export function facetLight(peak: Point, a: Point, b: Point, light: Point): number {
  const mx = (a.x + b.x) / 2 - peak.x;
  const my = (a.y + b.y) / 2 - peak.y;
  const len = Math.hypot(mx, my) || 1;
  const ll = Math.hypot(light.x, light.y) || 1;
  const toward = (mx * light.x + my * light.y) / (len * ll);
  const up = -my / len;
  return Math.max(0, Math.min(1, 0.45 + 0.4 * toward + 0.15 * up));
}
