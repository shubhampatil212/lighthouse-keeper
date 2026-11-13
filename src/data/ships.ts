import type { SmugglerConfig, ShipTypeConfig, ShipTypeId, TugConfig } from './types';

/**
 * Ship types from docs/CONTENT.md §2. The tugboat's towing and the smuggler's catch rules are below;
 * the ferry's "precious" rule and the sailboat's wind factor are fields on the type.
 */
export const SHIP_TYPES: Record<ShipTypeId, ShipTypeConfig> = {
  fishing: {
    speed: 18,
    length: 13,
    width: 6,
    coins: 10,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
    windFactor: 1,
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
    windFactor: 1,
  },
  sailboat: {
    speed: 16,
    length: 12,
    width: 5,
    coins: 10,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
    // "The wind pushes it 1.5× more than other ships while in the dark."
    windFactor: 1.5,
  },
  ferry: {
    speed: 13,
    length: 24,
    width: 9,
    coins: 30,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: true,
    windFactor: 1,
  },
  tugboat: {
    speed: 20,
    length: 11,
    width: 7,
    coins: 10,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
    windFactor: 1,
  },
  smuggler: {
    speed: 22,
    length: 14,
    width: 6,
    // Smugglers never reach a harbor; they pay SMUGGLER.catchBonus when caught.
    coins: 0,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
    windFactor: 1,
  },
};

/** "While lit, it slows nearby dark ships for you." Radius and slow aren't in CONTENT.md; see PROGRESS.md. */
export const TUG: TugConfig = {
  towRadius: 50,
  speedFactor: 0.5,
};

/** "Keep it lit for 2 s to catch it" (+25 coins); then a coast guard boat tows it away. */
export const SMUGGLER: SmugglerConfig = {
  catchSeconds: 2,
  catchBonus: 25,
  exitOffsetMin: 0.35,
  exitOffsetMax: 0.7,
  escapeMargin: 4,
  coastGuardSpeed: 34,
  coastGuardTurnRate: 3,
  towSpeed: 14,
  hookDistance: 10,
  towClearance: 30,
  coastGuardLength: 12,
  coastGuardWidth: 5,
};
