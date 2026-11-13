/**
 * Pirate ships (docs/CONTENT.md §3, region 4): they hunt dark ships and sink them on contact.
 * Lighting a pirate drives it away for 5 s. Fairness: a pirate only hunts ships inside the beam's
 * reach, and must chase one for `boardDelay` seconds before it can board, so the player always has a
 * window to light either ship.
 */
import type {
  PirateConfig,
  SeaConfig,
  ShipBehaviorConfig,
  ShipTypeConfig,
  ShipTypeId,
} from '../data/types';
import type { LightOrigin } from './beam';
import type { Emit } from './events';
import type { Rock } from './reefs';
import type { Ship, WakePoint } from './ships';
import { litHeading, turnToward } from './steering';

export type PirateMode = 'patrol' | 'hunt' | 'flee';

export interface Pirate {
  id: number;
  x: number;
  y: number;
  heading: number;
  mode: PirateMode;
  /** The ship it's chasing (0 = none) and for how long. */
  targetId: number;
  huntTime: number;
  /** Seconds left before it stops fleeing (counts down only once it's out of the light). */
  scared: number;
  lit: boolean;
  /** Which way round the island it patrols: 1 or -1. */
  patrolDir: number;
  wake: WakePoint[];
  wakeTimer: number;
}

export interface PirateRules {
  pirate: PirateConfig;
  sea: SeaConfig;
  behavior: ShipBehaviorConfig;
  types: Record<ShipTypeId, ShipTypeConfig>;
  /** Pirates only hunt ships within this distance of the island (the beam's reach). */
  huntLimit: number;
}

export function spawnPirate(id: number, angle: number, patrolDir: number, sea: SeaConfig): Pirate {
  return {
    id,
    x: Math.cos(angle) * sea.spawnRadius,
    y: Math.sin(angle) * sea.spawnRadius,
    heading: angle + Math.PI,
    mode: 'patrol',
    targetId: 0,
    huntTime: 0,
    scared: 0,
    lit: false,
    patrolDir,
    wake: [],
    wakeTimer: 0,
  };
}

/** A ship the pirate may chase: dark, not a smuggler (fellow outlaws), and in the beam's reach. */
function isPrey(ship: Ship, rules: PirateRules): boolean {
  return !ship.lit && ship.exit === null && Math.hypot(ship.x, ship.y) <= rules.huntLimit;
}

function pickTarget(pirate: Pirate, ships: readonly Ship[], rules: PirateRules): Ship | null {
  const current = ships.find((s) => s.id === pirate.targetId);
  if (current && isPrey(current, rules)) return current;
  let best: Ship | null = null;
  let bestD = rules.pirate.huntRadius;
  for (const ship of ships) {
    if (!isPrey(ship, rules)) continue;
    const d = Math.hypot(ship.x - pirate.x, ship.y - pirate.y);
    if (d <= bestD) {
      best = ship;
      bestD = d;
    }
  }
  return best;
}

/**
 * Advances every pirate one tick. Returns the ships boarded (sunk) this tick; the world removes them
 * and counts the wrecks.
 */
export function stepPirates(
  pirates: readonly Pirate[],
  ships: readonly Ship[],
  rocks: readonly Rock[],
  light: (x: number, y: number) => LightOrigin | null,
  rules: PirateRules,
  dt: number,
  tick: number,
  emit: Emit,
): Ship[] {
  const { pirate: config, sea, behavior } = rules;
  const boarded: Ship[] = [];
  for (const p of pirates) {
    const origin = light(p.x, p.y);
    p.lit = origin !== null;
    let desired: number;
    let speed: number;

    if (origin) {
      if (p.mode !== 'flee') emit({ type: 'pirateDrivenOff', tick, pirateId: p.id });
      p.mode = 'flee';
      p.scared = config.scareSeconds;
      p.targetId = 0;
      p.huntTime = 0;
    } else if (p.mode === 'flee') {
      p.scared -= dt;
      if (p.scared <= 0) p.mode = 'patrol';
    }

    const fromIsland = Math.atan2(p.y, p.x);
    const d = Math.hypot(p.x, p.y);
    if (p.mode === 'flee') {
      desired = origin ? Math.atan2(p.y - origin.y, p.x - origin.x) : fromIsland;
      // At the spawn ring it turns along it instead of leaving the map.
      if (d > sea.spawnRadius - 10) desired = fromIsland + (Math.PI / 2) * p.patrolDir;
      speed = config.fleeSpeed;
    } else {
      const target = pickTarget(p, ships, rules);
      if (target) {
        if (target.id !== p.targetId) {
          p.targetId = target.id;
          p.huntTime = 0;
          emit({ type: 'pirateHunting', tick, pirateId: p.id, shipId: target.id });
        }
        p.mode = 'hunt';
        p.huntTime += dt;
        desired = Math.atan2(target.y - p.y, target.x - p.x);
        speed = config.huntSpeed;
        const reach = (config.width + rules.types[target.type].width) / 2;
        if (Math.hypot(target.x - p.x, target.y - p.y) < reach && p.huntTime >= config.boardDelay) {
          boarded.push(target);
          p.targetId = 0;
          p.huntTime = 0;
          p.mode = 'patrol';
        }
      } else {
        p.mode = 'patrol';
        p.targetId = 0;
        p.huntTime = 0;
        // Head for a point a little further round the patrol circle.
        const ahead = fromIsland + 0.5 * p.patrolDir;
        desired = Math.atan2(
          Math.sin(ahead) * config.patrolRadius - p.y,
          Math.cos(ahead) * config.patrolRadius - p.x,
        );
        speed = config.patrolSpeed;
      }
    }

    desired = litHeading(p, desired, rocks, config.avoidPadding, behavior, [], speed);
    p.heading = turnToward(p.heading, desired, config.turnRate * dt);
    p.x += Math.cos(p.heading) * speed * dt;
    p.y += Math.sin(p.heading) * speed * dt;

    p.wakeTimer -= dt;
    if (p.wakeTimer <= 0) {
      p.wakeTimer = behavior.wakeInterval;
      p.wake.push({ x: p.x, y: p.y });
      if (p.wake.length > behavior.wakeLength) p.wake.shift();
    }
  }
  return boarded;
}
