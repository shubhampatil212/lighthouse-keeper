import type { StarRules } from './types';

/** Star thresholds from docs/GDD.md §3.5. A level may override them. */
export const DEFAULT_STARS: StarRules = {
  twoStarMaxWrecks: 1,
  threeStarMaxWrecks: 0,
};
