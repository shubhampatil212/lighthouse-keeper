/**
 * A new ship at the spawn ring, heading for its harbor (with a little jitter). A smuggler instead
 * heads for an exit point across the sea, a little to one side so its path misses the island.
 */
import type { ShipTypeId } from '../data/types';
import { createRng } from './rng';
import type { Ship, ShipRules, WakePoint } from './ships';

export function spawnShip(
  id: number,
  type: ShipTypeId,
  angle: number,
  speedMultiplier: number,
  rngSeed: number,
  rules: ShipRules,
  harborIndex = 0,
): Ship {
  const rng = createRng(rngSeed);
  const { behavior, sea } = rules;
  const x = Math.cos(angle) * sea.spawnRadius;
  const y = Math.sin(angle) * sea.spawnRadius;
  const jitter = rng.range(-behavior.spawnHeadingJitter, behavior.spawnHeadingJitter);
  const error = rng.range(-behavior.spawnErrorRange, behavior.spawnErrorRange);
  let goal: WakePoint = rules.harbors[harborIndex] ?? { x: 0, y: 0 };
  let exit: WakePoint | null = null;
  if (type === 'smuggler') {
    // Across the sea, a little to one side so its path misses the island.
    const side = rng.float() < 0.5 ? -1 : 1;
    const exitAngle =
      angle +
      Math.PI +
      side * rng.range(rules.smuggler.exitOffsetMin, rules.smuggler.exitOffsetMax);
    const reach = sea.spawnRadius + rules.smuggler.escapeMargin * 4;
    exit = { x: Math.cos(exitAngle) * reach, y: Math.sin(exitAngle) * reach };
    goal = exit;
  }
  return {
    id,
    type,
    x,
    y,
    heading: Math.atan2(goal.y - y, goal.x - x) + jitter,
    speed: rules.types[type].speed * speedMultiplier,
    harbor: harborIndex,
    lit: false,
    darkTime: 0,
    litTime: 0,
    lost: false,
    inDanger: false,
    error,
    errorTarget: 0,
    errorTimer: behavior.spawnErrorDelay,
    rngState: rng.state,
    exit,
    hornTimer: 0,
    towedBy: 0,
    whirlpool: -1,
    buoy: -1,
    wake: [],
    wakeTimer: 0,
  };
}
