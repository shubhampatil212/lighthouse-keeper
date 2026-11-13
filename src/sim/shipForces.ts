/**
 * What the sea does to a ship after it steers: storm waves, the current and whirlpools push it,
 * icebergs shove it aside, and nobody sails onto the island.
 */
import type { HarborDef, ShipTypeConfig } from '../data/types';
import type { Emit } from './events';
import type { Rock } from './reefs';
import type { SeaForces, Ship, ShipRules } from './ships';

/** True if a harbor is the island's own (ships bound elsewhere steer around the island). */
export const atIsland = (harbor: HarborDef, rules: ShipRules): boolean =>
  Math.hypot(harbor.x, harbor.y) < rules.islandRadius;

/**
 * The water's push: storm waves (every ship), the current (dark ships, ×wind factor) and whirlpools.
 * It never pushes a ship further out than the spawn ring, so none drift away forever.
 */
export function driftWithSea(
  ship: Ship,
  type: ShipTypeConfig,
  rules: ShipRules,
  sea: SeaForces,
  tick: number,
  emit: Emit,
  dt: number,
): void {
  let dx = sea.pushX;
  let dy = sea.pushY;
  if (!ship.lit) {
    dx += rules.currentX * type.windFactor;
    dy += rules.currentY * type.windFactor;
  }
  const { pullRadius, maxPull } = rules.whirlpool;
  let inside = -1;
  sea.whirlpools.forEach((w, i) => {
    const vx = w.x - ship.x;
    const vy = w.y - ship.y;
    const d = Math.hypot(vx, vy);
    if (d >= pullRadius || d < 0.001) return;
    inside = i;
    const pull = maxPull * (1 - d / pullRadius);
    dx += (vx / d) * pull;
    dy += (vy / d) * pull;
  });
  if (inside !== -1 && ship.whirlpool !== inside) {
    emit({ type: 'shipInWhirlpool', tick, shipId: ship.id, whirlpool: inside });
  }
  ship.whirlpool = inside;
  if (dx === 0 && dy === 0) return;
  const nx = ship.x + dx * dt;
  const ny = ship.y + dy * dt;
  const next = Math.hypot(nx, ny);
  if (next > rules.sea.spawnRadius && next > Math.hypot(ship.x, ship.y)) return;
  ship.x = nx;
  ship.y = ny;
}

/**
 * An iceberg drifting into a ship's side shoves it aside rather than sinking it; only a ship sailing
 * (nearly) head-on into an iceberg wrecks. Returns true if the ship was shoved clear.
 */
export function shovedByIceberg(ship: Ship, berg: Rock, hull: number, rules: ShipRules): boolean {
  const dx = ship.x - berg.x;
  const dy = ship.y - berg.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.001) return false;
  const nx = dx / d;
  const ny = dy / d;
  const headOn = -(Math.cos(ship.heading) * nx + Math.sin(ship.heading) * ny);
  if (headOn > rules.icebergHeadOnCos) return false;
  const clear = berg.r + hull;
  ship.x = berg.x + nx * clear;
  ship.y = berg.y + ny * clear;
  return true;
}

/** Ships never sail onto the island (only ships docking there reach it, and they dock first). */
export function keepOffIsland(
  ship: Ship,
  harbor: HarborDef,
  smuggler: boolean,
  rules: ShipRules,
): void {
  if (!smuggler && atIsland(harbor, rules)) return;
  const d = Math.hypot(ship.x, ship.y);
  const min = rules.islandRadius + rules.types[ship.type].width / 2;
  if (d >= min || d < 0.001) return;
  ship.x = (ship.x / d) * min;
  ship.y = (ship.y / d) * min;
}
