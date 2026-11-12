import type { ShipBehaviorConfig } from './types';

/**
 * How every ship steers, lit or dark (docs/GDD.md §3.2, docs/CONTENT.md §2).
 * Values CONTENT.md doesn't list (dark turn rate, avoidance weights, wake) come from the prototype.
 */
export const SHIP_BEHAVIOR: ShipBehaviorConfig = {
  darkSpeedFactor: 0.6,
  darkErrorRange: 1.05,
  darkErrorRerollMin: 2,
  darkErrorRerollMax: 4,
  darkErrorEase: 0.8,
  spawnErrorRange: 0.8,
  spawnErrorDelay: 2,
  spawnHeadingJitter: 0.4,
  litTurnRate: 1.9,
  darkTurnRate: 0.45,
  lostAfter: 4,
  avoidAheadCos: -0.3,
  avoidStrength: 2.4,
  avoidTangentFactor: 1.3,
  hullCollisionFactor: 0.45,
  wakeInterval: 0.15,
  wakeLength: 14,
};
