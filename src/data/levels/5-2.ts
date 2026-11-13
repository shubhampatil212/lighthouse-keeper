import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 5, level 2: "Red and blue". Two harbors: the island's, and a small one to the north-west.
 * Lit ships steer for their own. Shape: the two harbors sit across the sea from each other with
 * reefs on the line between, so a ship crossing to the far harbor needs light all the way.
 */
export const LEVEL_5_2: LevelDef = {
  id: '5-2',
  name: 'Red and blue',
  region: 'archipelago',
  seed: 5002,
  harbors: [
    { x: 0, y: 0, radius: 38 },
    { ...at(100, 300), radius: 24 },
  ],
  ships: fleet(1, 3.7, [
    ['fishing', 'east', 1],
    ['fishing', 'north', 0],
    ['cargo', 'south', 1],
    ['fishing', 'west', 0],
    ['sailboat', 'east', 1],
    ['fishing', 'south', 0],
    ['fishing', 'north', 1],
    ['cargo', 'east', 0],
    ['fishing', 'south', 1],
    ['fishing', 'west', 0],
    ['sailboat', 'north', 1],
    ['fishing', 'east', 0],
    ['cargo', 'west', 1],
    ['fishing', 'south', 0],
  ]),
  reefs: [reef(98, 345), reef(95, 250), reef(92, 90), reef(92, 160), reef(92, 30)],
  hazards: [],
  current: { angle: bearing(130), strength: 2 },
  bonus: { kind: 'finishUnder', seconds: 100 },
  stars: DEFAULT_STARS,
};
