import type { ShipTypeConfig, ShipTypeId } from './types';

/**
 * Ship types from docs/CONTENT.md §2. Sailboat, ferry, tugboat and smuggler have their stats and look
 * now; their special behaviors (wind, towing, fleeing the light) arrive in phase 04.
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
  sailboat: {
    speed: 16,
    length: 12,
    width: 5,
    coins: 10,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
  },
  ferry: {
    speed: 13,
    length: 24,
    width: 9,
    coins: 30,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: true,
  },
  tugboat: {
    speed: 20,
    length: 11,
    width: 7,
    coins: 10,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
  },
  smuggler: {
    speed: 22,
    length: 14,
    width: 6,
    // Smugglers pay a 25-coin bonus when caught (phase 04), never for reaching the harbor.
    coins: 0,
    turnRateMultiplier: 1,
    avoidPadding: 46,
    precious: false,
  },
};
