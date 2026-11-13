import type { StarCoinConfig, StarRules } from './types';

/** Star thresholds from docs/GDD.md §3.5. A level may override them. */
export const DEFAULT_STARS: StarRules = {
  twoStarMaxWrecks: 1,
  threeStarMaxWrecks: 0,
};

/** Only new stars pay, so replaying a night for coins pays its ships but not its stars again. */
export const STAR_COINS: StarCoinConfig = {
  perNewStar: 5,
};
