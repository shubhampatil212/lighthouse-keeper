import type { AbilitiesConfig } from './types';

/** Abilities from docs/GDD.md §3.4 and docs/CONTENT.md §4. */
export const ABILITIES: AbilitiesConfig = {
  foghorn: {
    radius: 140,
    speedFactor: 0.4,
    duration: 3,
    // Level 1: 12 s; each further level takes 2 s off.
    cooldown: 12,
    cooldownPerLevel: 2,
  },
  flare: {
    seconds: 1.5,
  },
  secondLamp: {
    isletRadius: 10,
    glowRadius: 36,
    sweepSpeed: 0.5,
  },
};
