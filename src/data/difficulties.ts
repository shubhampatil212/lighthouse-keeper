import type { DifficultyConfig, DifficultyId } from './types';

/** Difficulty multipliers from docs/CONTENT.md §5. */
export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  calm: {
    shipSpeed: 0.8,
    spawnInterval: 1.3,
    currentStrength: 0.6,
    wreckAllowance: 5,
    reefMemory: 6,
    coinReward: 1,
  },
  keeper: {
    shipSpeed: 1,
    spawnInterval: 1,
    currentStrength: 1,
    wreckAllowance: 3,
    reefMemory: 3,
    coinReward: 1,
  },
  storm: {
    shipSpeed: 1.15,
    spawnInterval: 0.8,
    currentStrength: 1.3,
    wreckAllowance: 2,
    reefMemory: 1.5,
    coinReward: 1.25,
  },
};

export const DEFAULT_DIFFICULTY: DifficultyId = 'keeper';
