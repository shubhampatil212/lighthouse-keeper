/** Steering helpers shared by ships and pirates: going around obstacles and leaning into a push. */
import type { ShipBehaviorConfig } from '../data/types';
import { wrapAngle } from './angle';
import type { Rock } from './reefs';

/** Something a lit ship steers around: a circle of radius r, avoided from r + pad. */
export interface Obstacle {
  x: number;
  y: number;
  r: number;
  pad: number;
}

/** A circle that may be drifting (icebergs); plain rocks have vx = vy = 0. */
interface Moving {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

export interface Heading {
  x: number;
  y: number;
  heading: number;
}

/**
 * Adds the push away from (and around) one obstacle to the wanted direction (dx, dy). "Ahead" is
 * judged by how the mover and the obstacle are closing on each other, so a drifting iceberg coming
 * in from the side counts as ahead too. For a still rock that's simply the mover's heading.
 */
function avoid(
  mover: Heading,
  speed: number,
  o: Moving,
  reach: number,
  pad: number,
  behavior: ShipBehaviorConfig,
  dir: { dx: number; dy: number },
): void {
  const vx = mover.x - o.x;
  const vy = mover.y - o.y;
  const d = Math.hypot(vx, vy);
  if (d >= reach || d <= 0.01) return;
  let hx = Math.cos(mover.heading);
  let hy = Math.sin(mover.heading);
  if (o.vx !== undefined && o.vy !== undefined && (o.vx !== 0 || o.vy !== 0)) {
    const rx = hx * speed - o.vx;
    const ry = hy * speed - o.vy;
    const rl = Math.hypot(rx, ry);
    if (rl > 0.001) {
      hx = rx / rl;
      hy = ry / rl;
    }
  }
  const ahead = -(vx * hx + vy * hy) / d;
  if (ahead <= behavior.avoidAheadCos) return;
  const w = ((reach - d) / pad) * behavior.avoidStrength;
  // Tangent around the obstacle, on the side the mover is already turning toward.
  let tx = -vy / d;
  let ty = vx / d;
  if (tx * hx + ty * hy < 0) {
    tx = -tx;
    ty = -ty;
  }
  dir.dx += (vx / d) * w + tx * w * behavior.avoidTangentFactor;
  dir.dy += (vy / d) * w + ty * w * behavior.avoidTangentFactor;
}

/**
 * The heading a mover wants: toward `goal` (radians), pushed sideways around any rock close ahead
 * (avoided from rock radius + padding) and any extra obstacle (whirlpool cores, the island).
 * `speed` matters only against drifting icebergs.
 */
export function litHeading(
  mover: Heading,
  goal: number,
  rocks: readonly Rock[],
  padding: number,
  behavior: ShipBehaviorConfig,
  extra: readonly Obstacle[] = [],
  speed = 1,
): number {
  const dir = { dx: Math.cos(goal), dy: Math.sin(goal) };
  for (const rock of rocks) avoid(mover, speed, rock, rock.r + padding, padding, behavior, dir);
  for (const o of extra) avoid(mover, speed, o, o.r + o.pad, o.pad, behavior, dir);
  return Math.atan2(dir.dy, dir.dx);
}

/**
 * The heading that makes a mover at `speed` actually travel along `wanted` while the water pushes it
 * by (pushX, pushY): it leans into the push. If the push across its path is stronger than it can
 * cancel, it points straight against that part of the push.
 */
export function leanIntoPush(wanted: number, speed: number, pushX: number, pushY: number): number {
  if (pushX === 0 && pushY === 0) return wanted;
  const dx = Math.cos(wanted);
  const dy = Math.sin(wanted);
  const along = pushX * dx + pushY * dy;
  const acrossX = pushX - along * dx;
  const acrossY = pushY - along * dy;
  const across2 = acrossX * acrossX + acrossY * acrossY;
  const speed2 = speed * speed;
  if (across2 >= speed2) return Math.atan2(-acrossY, -acrossX);
  const k = Math.sqrt(speed2 - across2);
  return Math.atan2(-acrossY + k * dy, -acrossX + k * dx);
}

/** Turns `heading` toward `desired` by at most `maxTurn` radians, the short way round. */
export function turnToward(heading: number, desired: number, maxTurn: number): number {
  return wrapAngle(heading + Math.max(-maxTurn, Math.min(maxTurn, wrapAngle(desired - heading))));
}
