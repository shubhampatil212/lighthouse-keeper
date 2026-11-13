import type { SeaConfig, Upgrades } from './types';

/** The play area's fixed rules: where ships appear, the harbor zone, buoys and generated rocks. */
export const SEA: SeaConfig = {
  // Just outside the 230-unit circle that is always on screen, so every device sees the same night.
  spawnRadius: 250,
  edgeSpawnSpread: 0.5,
  // Island radius (34) + 4, as in the prototype.
  defaultHarborRadius: 38,
  buoyRadius: 54,
  rockRadiusMin: 6,
  rockRadiusMax: 12,
  rocksPerReefMin: 2,
  rocksPerReefMax: 4,
  rockSpread: 15,
  // Found with the fairness test (tests/sim/fairness.test.ts); see docs/PROGRESS.md.
  reefRangeMargin: 50,
  // Found with the play-tester: at 8 wu/s a dark cargo ship on Storm was held at the spawn ring.
  currentMaxShare: 0.75,
};

/** A new keeper's upgrades: nothing bought yet. */
export const NO_UPGRADES: Upgrades = {
  lens: 0,
  lamp: 0,
  gears: 0,
  foghorn: 0,
  flares: 0,
  buoys: [],
};
