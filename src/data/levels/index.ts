/** Campaign and endless level files (docs/CONTENT.md §6). */
import type { LevelDef } from '../types';
import { LEVEL_1_1 } from './1-1';
import { LEVEL_1_2 } from './1-2';
import { LEVEL_1_3 } from './1-3';
import { LEVEL_1_4 } from './1-4';
import { LEVEL_1_5 } from './1-5';
import { LEVEL_1_6 } from './1-6';
import { LEVEL_2_1 } from './2-1';
import { LEVEL_2_2 } from './2-2';
import { LEVEL_2_3 } from './2-3';
import { LEVEL_2_4 } from './2-4';
import { LEVEL_2_5 } from './2-5';
import { LEVEL_2_6 } from './2-6';
import { LEVEL_3_1 } from './3-1';
import { LEVEL_3_2 } from './3-2';
import { LEVEL_3_3 } from './3-3';
import { LEVEL_3_4 } from './3-4';
import { LEVEL_3_5 } from './3-5';
import { LEVEL_3_6 } from './3-6';
import { LEVEL_4_1 } from './4-1';
import { LEVEL_4_2 } from './4-2';
import { LEVEL_4_3 } from './4-3';
import { LEVEL_4_4 } from './4-4';
import { LEVEL_4_5 } from './4-5';
import { LEVEL_4_6 } from './4-6';
import { LEVEL_5_1 } from './5-1';
import { LEVEL_5_2 } from './5-2';
import { LEVEL_5_3 } from './5-3';
import { LEVEL_5_4 } from './5-4';
import { LEVEL_5_5 } from './5-5';
import { LEVEL_5_6 } from './5-6';
import { DEMO_LEVELS, DEMO_UPGRADES } from './demos';

export { DEMO_LEVELS, DEMO_UPGRADES, LEVEL_1_2 };
export * from './backdrop';
export * from './sandbox';
export * from './shape';

const CAMPAIGN_LEVELS: readonly LevelDef[] = [
  LEVEL_1_1,
  LEVEL_1_2,
  LEVEL_1_3,
  LEVEL_1_4,
  LEVEL_1_5,
  LEVEL_1_6,
  LEVEL_2_1,
  LEVEL_2_2,
  LEVEL_2_3,
  LEVEL_2_4,
  LEVEL_2_5,
  LEVEL_2_6,
  LEVEL_3_1,
  LEVEL_3_2,
  LEVEL_3_3,
  LEVEL_3_4,
  LEVEL_3_5,
  LEVEL_3_6,
  LEVEL_4_1,
  LEVEL_4_2,
  LEVEL_4_3,
  LEVEL_4_4,
  LEVEL_4_5,
  LEVEL_4_6,
  LEVEL_5_1,
  LEVEL_5_2,
  LEVEL_5_3,
  LEVEL_5_4,
  LEVEL_5_5,
  LEVEL_5_6,
];

/** Every playable level, by id. */
export const LEVELS: Readonly<Record<string, LevelDef>> = Object.fromEntries(
  CAMPAIGN_LEVELS.map((level) => [level.id, level]),
);
