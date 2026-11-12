import type { ShipTypeConfig, ShipTypeId } from './types';

/** Ship types from docs/CONTENT.md §2. More arrive in phase 04. */
export const SHIP_TYPES: Record<ShipTypeId, ShipTypeConfig> = {
  fishing: {
    speed: 18,
    length: 13,
    width: 6,
    coins: 10,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
  },
  cargo: {
    speed: 12,
    length: 22,
    width: 9,
    coins: 15,
    turnRateMultiplier: 0.7,
    // "Needs a wider path around reefs": 10 wu more room than a fishing boat.
    avoidPadding: 56,
    precious: false,
  },
};
