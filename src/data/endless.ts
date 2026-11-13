import type { EndlessConfig } from './types';

/** Endless watch (docs/CONTENT.md §7). Numbers the doc doesn't give are noted in PROGRESS.md. */
export const ENDLESS: EndlessConfig = {
  // "Starts at 1 ship every 6 s. Every 30 s: spawn interval ×0.92 (minimum 1.6 s), one new reef
  // cluster, and a new hazard type every 2 minutes."
  startInterval: 6,
  rampEvery: 30,
  rampFactor: 0.92,
  minInterval: 1.6,
  hazardEvery: 120,
  startReefs: 2,
  maxReefs: 12,
  // Rocks spread up to ~33 wu round a centre: 75–90 keeps them clear of the harbor and inside the
  // storm-wave reef limit (124 wu).
  reefDistanceMin: 75,
  reefDistanceMax: 90,
  reefClearance: 30,
  shipClearance: 45,
  scorePerShip: 10,
  currentStrength: 2.5,
  // No ferries: losing one would end the watch at once.
  shipWeights: { fishing: 6, cargo: 2, sailboat: 2, tugboat: 1, smuggler: 1 },
  fogDistance: 130,
  fogLength: 160,
  fogWidth: 34,
  icebergDistance: 90,
  whirlpoolDistance: 110,
};
