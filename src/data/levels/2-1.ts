import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef, wall } from './shape';

/**
 * Region 2, level 1: "Frost line", the foghorn tutorial (the horn is lent for the night).
 * Shape: ships come down from the north in bunches of three, past a frost line of rocks with two
 * gaps. One beam can't hold three ships; the horn slows the bunch while you work through it.
 */
export const LEVEL_2_1: LevelDef = {
  id: '2-1',
  name: 'Frost line',
  region: 'northernIce',
  seed: 2001,
  loan: { foghorn: 1 },
  ships: [
    ...fleet(1, 1.5, [
      ['fishing', 340],
      ['fishing', 0],
      ['cargo', 25],
    ]),
    ...fleet(20, 1.5, [
      ['fishing', 315],
      ['sailboat', 350],
      ['fishing', 20],
    ]),
    ...fleet(39, 1.5, [
      ['cargo', 330],
      ['fishing', 5],
      ['fishing', 40],
      ['sailboat', 290],
    ]),
  ],
  reefs: [wall(96, 330, 3), wall(98, 30, 3), reef(90, 160), { ...at(92, 220) }],
  hazards: [],
  current: { angle: bearing(160), strength: 2.5 },
  bonus: { kind: 'savedTogether', count: 3, within: 6 },
  stars: DEFAULT_STARS,
};
