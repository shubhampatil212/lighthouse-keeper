import { DEFAULT_STARS } from '../stars';
import type { HarborDef, LevelDef, Upgrades } from '../types';

/**
 * The sandbox night (debug only, #sandbox): 1-2's reefs and nothing else. Ships and hazards are
 * added from the sandbox panel while it runs; the night never ends on its own.
 */
export const SANDBOX_LEVEL: LevelDef = {
  id: 'sandbox',
  name: 'Sandbox',
  region: 'harborBay',
  seed: 1002,
  ships: [],
  reefs: [
    { x: 30, y: -110 },
    { x: -108, y: 27 },
    { x: 124, y: 38 },
    { x: -37, y: 109 },
  ],
  hazards: [],
  current: { angle: 0.6, strength: 4 },
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
};

/** The sandbox's optional second harbor and second lighthouse. */
export const SANDBOX_SECOND_HARBOR: HarborDef = { x: -85, y: -62, radius: 24 };
export const SANDBOX_SECOND_LAMP = { x: 100, y: -85 };

/** Upgrades the sandbox starts with: every ability, so each can be tried. */
export const SANDBOX_UPGRADES: Upgrades = {
  lens: 0,
  lamp: 0,
  gears: 0,
  foghorn: 1,
  flares: 3,
  buoys: [],
};

/** Hazard sizes the sandbox uses when it places one (world units). */
export const SANDBOX_PLACING = {
  fogLength: 150,
  fogWidth: 32,
  /** Random placements land this far from the island (min, max). */
  nearMin: 75,
  nearMax: 125,
};
