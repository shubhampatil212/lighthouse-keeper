import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 5, level 1: "Two lights". A second lighthouse on an islet to the north-east. The lamp you
 * aren't steering sweeps on its own. Shape: a reef field out past the islet that only the second
 * lamp reaches well, and a quiet west.
 */
export const LEVEL_5_1: LevelDef = {
  id: '5-1',
  name: 'Two lights',
  region: 'archipelago',
  seed: 5001,
  secondLamp: at(112, 60),
  ships: fleet(1, 3.5, [
    ['fishing', 60],
    ['fishing', 'west'],
    ['cargo', 40],
    ['fishing', 'south'],
    ['sailboat', 80],
    ['fishing', 'north'],
    ['fishing', 50],
    ['cargo', 'west'],
    ['fishing', 'south'],
    ['sailboat', 70],
    ['fishing', 'north'],
    ['fishing', 90],
    ['cargo', 'south'],
    ['fishing', 55],
  ]),
  reefs: [
    reef(165, 50),
    reef(160, 78),
    reef(92, 20),
    reef(92, 110),
    reef(95, 165),
    reef(92, 220),
    reef(95, 290),
  ],
  hazards: [],
  current: { angle: bearing(240), strength: 2 },
  bonus: { kind: 'noLongDark', seconds: 7 },
  stars: DEFAULT_STARS,
};
