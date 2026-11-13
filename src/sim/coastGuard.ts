/**
 * The coast guard: once a smuggler is caught, a small boat leaves the island, hooks onto it and
 * tows it off the map. Purely a little story after the catch: the smuggler already counts as
 * resolved, so nothing here can change the outcome of the night.
 */
import type { SeaConfig, ShipBehaviorConfig, SmugglerConfig } from '../data/types';
import type { Emit } from './events';
import type { Ship, WakePoint } from './ships';
import { turnToward } from './steering';

export interface Tow {
  /** The coast guard boat's own id (shared id space with ships and pirates). */
  id: number;
  x: number;
  y: number;
  heading: number;
  phase: 'approach' | 'towing';
  lit: boolean;
  /** The caught smuggler, held still until hooked, then dragged behind. */
  smuggler: { id: number; x: number; y: number; heading: number };
  wake: WakePoint[];
  wakeTimer: number;
}

/** Launches a coast guard boat from the island's edge toward the caught smuggler. */
export function launchTow(id: number, smuggler: Ship, islandRadius: number): Tow {
  const toward = Math.atan2(smuggler.y, smuggler.x);
  return {
    id,
    x: Math.cos(toward) * (islandRadius + 4),
    y: Math.sin(toward) * (islandRadius + 4),
    heading: toward,
    phase: 'approach',
    lit: false,
    smuggler: { id: smuggler.id, x: smuggler.x, y: smuggler.y, heading: smuggler.heading },
    wake: [],
    wakeTimer: 0,
  };
}

/** Moves every tow; returns the ones still on the map. */
export function stepTows(
  tows: readonly Tow[],
  config: SmugglerConfig,
  sea: SeaConfig,
  behavior: ShipBehaviorConfig,
  lit: (x: number, y: number) => boolean,
  dt: number,
  tick: number,
  emit: Emit,
): Tow[] {
  const kept: Tow[] = [];
  for (const tow of tows) {
    const s = tow.smuggler;
    if (tow.phase === 'approach') {
      const toSmuggler = Math.atan2(s.y - tow.y, s.x - tow.x);
      tow.heading = turnToward(tow.heading, toSmuggler, config.coastGuardTurnRate * dt);
      tow.x += Math.cos(tow.heading) * config.coastGuardSpeed * dt;
      tow.y += Math.sin(tow.heading) * config.coastGuardSpeed * dt;
      if (Math.hypot(s.x - tow.x, s.y - tow.y) < config.hookDistance) {
        tow.phase = 'towing';
        emit({ type: 'smugglerTowed', tick, shipId: s.id, x: s.x, y: s.y });
      }
    } else {
      const out = Math.atan2(tow.y, tow.x);
      tow.heading = turnToward(tow.heading, out, config.coastGuardTurnRate * 0.5 * dt);
      tow.x += Math.cos(tow.heading) * config.towSpeed * dt;
      tow.y += Math.sin(tow.heading) * config.towSpeed * dt;
      // The smuggler trails on a short line behind.
      const line = config.hookDistance + config.coastGuardLength / 2;
      s.heading = Math.atan2(tow.y - s.y, tow.x - s.x);
      s.x = tow.x - Math.cos(s.heading) * line;
      s.y = tow.y - Math.sin(s.heading) * line;
    }
    tow.lit = lit(tow.x, tow.y);
    tow.wakeTimer -= dt;
    if (tow.wakeTimer <= 0) {
      tow.wakeTimer = behavior.wakeInterval;
      tow.wake.push({ x: tow.x, y: tow.y });
      if (tow.wake.length > behavior.wakeLength) tow.wake.shift();
    }
    if (Math.hypot(s.x, s.y) < sea.spawnRadius + config.towClearance) kept.push(tow);
  }
  return kept;
}
