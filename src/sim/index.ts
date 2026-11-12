/**
 * Pure game logic: world, ships, hazards, beam, rules. No Pixi, no DOM, no Math.random, no Date.
 * Advances in fixed 60 Hz steps and uses the seeded RNG. (ESLint enforces this.) Built in phase 02.
 */
export * from './angle';
export * from './rng';
