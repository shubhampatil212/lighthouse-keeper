import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 5, level 3: "Island hopping". The second lamp and two harbors together.
 * Shape: the second tower stands south-east, the small harbor north-east; scattered rocks between
 * the islands make narrow channels ships must be lit through.
 */
export const LEVEL_5_3: LevelDef = {
  id: '5-3',
  name: 'Island hopping',
  region: 'archipelago',
  seed: 5003,
  secondLamp: at(115, 150),
  harbors: [
    { x: 0, y: 0, radius: 38 },
    { ...at(100, 40), radius: 24 },
  ],
  // Phase 10 balance: ships come faster (2.5 → 1.9 s), two more are slow-turning cargo ships, the
  // current is stronger (2.5 → 3), and a seventh reef sits on the west approach: the sweeper bot
  // almost never failed here.
  ships: fleet(1, 1.9, [
    ['fishing', 'south', 0],
    ['fishing', 'north', 1],
    ['cargo', 'west', 0],
    ['fishing', 'east', 1],
    ['sailboat', 'south', 1],
    ['cargo', 'west', 0],
    ['fishing', 'north', 0],
    ['cargo', 'east', 1],
    ['fishing', 'south', 0],
    ['fishing', 'west', 1],
    ['sailboat', 'north', 0],
    ['fishing', 'east', 0],
    ['fishing', 'south', 1],
    ['cargo', 'west', 0],
  ]),
  reefs: [
    reef(95, 95),
    reef(150, 165),
    reef(150, 125),
    reef(92, 220),
    reef(95, 300),
    reef(85, 350),
    reef(120, 250),
  ],
  hazards: [],
  current: { angle: bearing(200), strength: 3 },
  bonus: { kind: 'noLongDark', seconds: 8 },
  stars: DEFAULT_STARS,
};
