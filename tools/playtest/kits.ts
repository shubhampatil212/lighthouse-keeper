/**
 * What a typical keeper owns when they reach each region: the upgrades the bots play with. The
 * report's economy table checks these are affordable from the coins the regions before pay.
 */
import { NO_UPGRADES } from '../../src/data';
import type { Upgrades } from '../../src/data/types';

export const REGION_KITS: readonly Upgrades[] = [
  NO_UPGRADES,
  { ...NO_UPGRADES, lens: 1, lamp: 1, gears: 1, foghorn: 1 },
  { ...NO_UPGRADES, lens: 2, lamp: 2, gears: 2, foghorn: 1, flares: 1 },
  { ...NO_UPGRADES, lens: 2, lamp: 3, gears: 2, foghorn: 2, flares: 1 },
  { ...NO_UPGRADES, lens: 3, lamp: 3, gears: 3, foghorn: 2, flares: 2 },
];
