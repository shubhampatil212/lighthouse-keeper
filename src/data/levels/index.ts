/** Campaign and endless level files (docs/CONTENT.md §6). */
import type { LevelDef } from '../types';
import { LEVEL_1_2 } from './1-2';
import { DEMO_LEVELS, DEMO_UPGRADES } from './demos';

export { DEMO_LEVELS, DEMO_UPGRADES, LEVEL_1_2 };
export * from './sandbox';

/** Every playable level, by id. */
export const LEVELS: Readonly<Record<string, LevelDef>> = {
  [LEVEL_1_2.id]: LEVEL_1_2,
};
