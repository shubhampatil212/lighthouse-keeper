/**
 * Helpers for writing levels by compass bearing: 0° = north (up the screen), 90° = east, clockwise,
 * the way a chart is read. The simulation uses radians with 0 = east and y growing downward.
 */
import type { Compass, ReefDef, RockDef, ShipSpawnDef, ShipTypeId } from '../types';

const RAD = Math.PI / 180;
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** The simulation angle (radians) of a compass bearing in degrees. */
export const bearing = (degrees: number): number => (degrees - 90) * RAD;

/** A point `distance` world units out from the island on a compass bearing. */
export function at(distance: number, degrees: number): { x: number; y: number } {
  const a = bearing(degrees);
  return { x: round1(Math.cos(a) * distance), y: round1(Math.sin(a) * distance) };
}

/** A reef cluster at a bearing; rocks generated from the level seed unless given. */
export const reef = (distance: number, degrees: number, rocks?: readonly RockDef[]): ReefDef =>
  rocks ? { ...at(distance, degrees), rocks } : at(distance, degrees);

/**
 * A hand-placed line of rocks across the sea, centred on a bearing: a "wall". The rocks run
 * along the circle at `distance`, `count` of them, `gap` world units apart, each of radius `r`.
 */
export function wall(distance: number, degrees: number, count: number, gap = 16, r = 8): ReefDef {
  const centre = at(distance, degrees);
  const along = bearing(degrees) + Math.PI / 2;
  const rocks: RockDef[] = Array.from({ length: count }, (_, i) => {
    const offset = (i - (count - 1) / 2) * gap;
    return { dx: round1(Math.cos(along) * offset), dy: round1(Math.sin(along) * offset), r };
  });
  return { ...centre, rocks };
}

/** One ship in a fleet: its type, where it comes from (a compass edge or a bearing), its harbor. */
export type FleetEntry =
  readonly [ShipTypeId, Compass | number] | readonly [ShipTypeId, Compass | number, number];

/**
 * A schedule of ships, the first at `start` seconds and each next one `gap` seconds later.
 * Numbers are compass bearings (exact), edges spread a little (SEA.edgeSpawnSpread).
 */
export function fleet(start: number, gap: number, entries: readonly FleetEntry[]): ShipSpawnDef[] {
  return entries.map(([type, from, harbor], i) => {
    const at = Math.round((start + i * gap) * 10) / 10;
    const where = typeof from === 'number' ? { angle: bearing(from) } : { edge: from };
    return harbor === undefined ? { type, at, ...where } : { type, at, ...where, harbor };
  });
}
