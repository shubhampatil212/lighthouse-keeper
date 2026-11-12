/**
 * Ships: lit ships see nearby rocks and steer around them toward the harbor at full speed.
 * Dark ships drift: their heading wanders, they slow down and the current pushes them
 * (docs/GDD.md §3.2, docs/CONTENT.md §2; steering ported from the prototype's updShips).
 */
import type {
  HarborDef,
  SeaConfig,
  ShipBehaviorConfig,
  ShipTypeConfig,
  ShipTypeId,
} from '../data/types';
import { wrapAngle } from './angle';
import type { Emit } from './events';
import { rockAt, type Rock } from './reefs';
import { createRng } from './rng';

export interface WakePoint {
  x: number;
  y: number;
}

export interface Ship {
  id: number;
  type: ShipTypeId;
  x: number;
  y: number;
  /** Direction of travel (radians). */
  heading: number;
  /** Full speed after the difficulty multiplier. */
  speed: number;
  /** Index into the world's harbors. */
  harbor: number;
  lit: boolean;
  /** Seconds since the ship was last lit. */
  darkTime: number;
  /** Shown with a "?" marker after lostAfter seconds in the dark. */
  lost: boolean;
  /** Dark drift: current heading error, the value it eases toward, and time until a new one. */
  error: number;
  errorTarget: number;
  errorTimer: number;
  /** Each ship has its own random stream, so lighting one ship never changes how another drifts. */
  rngState: number;
  wake: WakePoint[];
  wakeTimer: number;
}

export interface ShipRules {
  behavior: ShipBehaviorConfig;
  types: Record<ShipTypeId, ShipTypeConfig>;
  sea: SeaConfig;
  harbors: readonly HarborDef[];
  /** Current drift in world units per second, after the difficulty multiplier. */
  currentX: number;
  currentY: number;
}

export type ShipFate = { kind: 'sailing' } | { kind: 'saved' } | { kind: 'wrecked'; rock: Rock };

const SAILING: ShipFate = { kind: 'sailing' };

export function spawnShip(
  id: number,
  type: ShipTypeId,
  angle: number,
  speedMultiplier: number,
  rngSeed: number,
  rules: ShipRules,
): Ship {
  const rng = createRng(rngSeed);
  const { behavior, sea } = rules;
  const x = Math.cos(angle) * sea.spawnRadius;
  const y = Math.sin(angle) * sea.spawnRadius;
  const harbor = rules.harbors[0] ?? { x: 0, y: 0 };
  return {
    id,
    type,
    x,
    y,
    heading:
      Math.atan2(harbor.y - y, harbor.x - x) +
      rng.range(-behavior.spawnHeadingJitter, behavior.spawnHeadingJitter),
    speed: rules.types[type].speed * speedMultiplier,
    harbor: 0,
    lit: false,
    darkTime: 0,
    lost: false,
    error: rng.range(-behavior.spawnErrorRange, behavior.spawnErrorRange),
    errorTarget: 0,
    errorTimer: behavior.spawnErrorDelay,
    rngState: rng.state,
    wake: [],
    wakeTimer: 0,
  };
}

/** Heading a lit ship wants: toward the harbor, pushed sideways around any rock close ahead. */
export function litHeading(
  ship: Ship,
  toHarbor: number,
  rocks: readonly Rock[],
  padding: number,
  behavior: ShipBehaviorConfig,
): number {
  let dx = Math.cos(toHarbor);
  let dy = Math.sin(toHarbor);
  const hx = Math.cos(ship.heading);
  const hy = Math.sin(ship.heading);
  for (const rock of rocks) {
    const vx = ship.x - rock.x;
    const vy = ship.y - rock.y;
    const d = Math.hypot(vx, vy);
    const reach = rock.r + padding;
    if (d >= reach || d <= 0.01) continue;
    const ahead = -(vx * hx + vy * hy) / d;
    if (ahead <= behavior.avoidAheadCos) continue;
    const w = ((reach - d) / padding) * behavior.avoidStrength;
    // Tangent around the rock, on the side the ship is already turning toward.
    let tx = -vy / d;
    let ty = vx / d;
    if (tx * hx + ty * hy < 0) {
      tx = -tx;
      ty = -ty;
    }
    dx += (vx / d) * w + tx * w * behavior.avoidTangentFactor;
    dy += (vy / d) * w + ty * w * behavior.avoidTangentFactor;
  }
  return Math.atan2(dy, dx);
}

/** Advances one ship by one tick and says whether it is still sailing, saved or wrecked. */
export function stepShip(
  ship: Ship,
  rocks: readonly Rock[],
  lit: (x: number, y: number) => boolean,
  rules: ShipRules,
  dt: number,
  tick: number,
  emit: Emit,
): ShipFate {
  const { behavior, sea } = rules;
  const type = rules.types[ship.type];
  const harbor = rules.harbors[ship.harbor] ?? { x: 0, y: 0, radius: sea.defaultHarborRadius };
  const wasLit = ship.lit;
  ship.lit = lit(ship.x, ship.y);
  const toHarbor = Math.atan2(harbor.y - ship.y, harbor.x - ship.x);

  let desired: number;
  let turnRate: number;
  let speed: number;
  if (ship.lit) {
    if (!wasLit) emit({ type: 'shipLit', tick, shipId: ship.id });
    ship.darkTime = 0;
    ship.lost = false;
    desired = litHeading(ship, toHarbor, rocks, type.avoidPadding, behavior);
    turnRate = behavior.litTurnRate;
    speed = ship.speed;
  } else {
    ship.darkTime += dt;
    if (!ship.lost && ship.darkTime >= behavior.lostAfter) {
      ship.lost = true;
      emit({ type: 'shipLost', tick, shipId: ship.id });
    }
    ship.errorTimer -= dt;
    if (ship.errorTimer <= 0) {
      const rng = createRng(ship.rngState);
      ship.errorTimer = rng.range(behavior.darkErrorRerollMin, behavior.darkErrorRerollMax);
      ship.errorTarget = rng.range(-behavior.darkErrorRange, behavior.darkErrorRange);
      ship.rngState = rng.state;
    }
    ship.error += (ship.errorTarget - ship.error) * dt * behavior.darkErrorEase;
    desired = toHarbor + ship.error;
    turnRate = behavior.darkTurnRate;
    speed = ship.speed * behavior.darkSpeedFactor;
    driftWithCurrent(ship, rules, dt);
  }

  const maxTurn = turnRate * type.turnRateMultiplier * dt;
  ship.heading = wrapAngle(
    ship.heading + Math.max(-maxTurn, Math.min(maxTurn, wrapAngle(desired - ship.heading))),
  );
  ship.x += Math.cos(ship.heading) * speed * dt;
  ship.y += Math.sin(ship.heading) * speed * dt;

  ship.wakeTimer -= dt;
  if (ship.wakeTimer <= 0) {
    ship.wakeTimer = behavior.wakeInterval;
    ship.wake.push({ x: ship.x, y: ship.y });
    if (ship.wake.length > behavior.wakeLength) ship.wake.shift();
  }

  const rock = rockAt(rocks, ship.x, ship.y, type.width * behavior.hullCollisionFactor);
  if (rock) return { kind: 'wrecked', rock };
  if (Math.hypot(ship.x - harbor.x, ship.y - harbor.y) < harbor.radius) return { kind: 'saved' };
  return SAILING;
}

/** The current pushes dark ships, but never further out than the spawn ring, so none drift away forever. */
function driftWithCurrent(ship: Ship, rules: ShipRules, dt: number): void {
  const nx = ship.x + rules.currentX * dt;
  const ny = ship.y + rules.currentY * dt;
  const next = Math.hypot(nx, ny);
  if (next > rules.sea.spawnRadius && next > Math.hypot(ship.x, ship.y)) return;
  ship.x = nx;
  ship.y = ny;
}
