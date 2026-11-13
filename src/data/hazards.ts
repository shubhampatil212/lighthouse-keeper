import type { HazardsConfig } from './types';

/**
 * Hazards from docs/CONTENT.md §3. Numbers CONTENT.md doesn't give (pull strength, pirate speeds,
 * the pirate's boarding delay) were picked in phase 04; see docs/PROGRESS.md.
 */
export const HAZARDS: HazardsConfig = {
  fog: {
    // "Shrink the beam's range by 35% where the beam passes through them."
    rangeFactor: 0.65,
  },
  iceberg: {
    radiusMin: 18,
    radiusMax: 30,
    speedMin: 3,
    speedMax: 6,
    headOnCos: 0.5,
    harborGap: 10,
    // About a cargo ship's turning room, so an iceberg never closes a channel next to a reef.
    laneGap: 30,
  },
  lightning: {
    intervalMin: 8,
    intervalMax: 15,
    warning: 1,
    flash: 0.25,
  },
  stormWaves: {
    push: 6,
    period: 10,
    // Found with the fairness test: on Storm a dark ship can drift at ~24 wu/s with the waves behind it.
    extraReefMargin: 16,
  },
  whirlpool: {
    pullRadius: 60,
    coreRadius: 10,
    maxPull: 8,
    avoidPadding: 40,
  },
  pirate: {
    length: 18,
    width: 7,
    patrolSpeed: 11,
    huntSpeed: 19,
    fleeSpeed: 22,
    turnRate: 1.6,
    patrolRadius: 150,
    huntRadius: 90,
    boardDelay: 2.5,
    scareSeconds: 5,
    avoidPadding: 30,
  },
};
