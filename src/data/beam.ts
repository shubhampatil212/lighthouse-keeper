import type { BeamConfig, BeamFeelConfig, BeamUpgradeConfig } from './types';

/** Base beam stats from docs/CONTENT.md §1 (before upgrades). */
export const BEAM: BeamConfig = {
  halfAngle: 0.2,
  range: 190,
  turnSpeed: 2.4,
  islandGlowRadius: 60,
  idleSweepSpeed: 0.5,
};

/** What each upgrade level adds (docs/CONTENT.md §1 and §4). */
export const BEAM_UPGRADES: BeamUpgradeConfig = {
  halfAngle: { perLevel: 0.05, maxLevel: 5 },
  range: { perLevel: 28, maxLevel: 5 },
  turnSpeed: { perLevel: 0.7, maxLevel: 4 },
};

/** How the beam moves and what counts as "in the light" (GDD §3.1, §8). */
export const BEAM_FEEL: BeamFeelConfig = {
  easeRate: 10,
  snapAngle: 0.0005,
  edgeTolerance: 4,
  startAngle: -Math.PI / 2,
};
