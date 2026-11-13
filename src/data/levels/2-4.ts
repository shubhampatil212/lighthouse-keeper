import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 2, level 4: "White wall". Thick fog bands shorten the beam.
 * Shape: a wall of fog out past the reefs across the whole east and another across the north:
 * ships coming through it stay hidden until they're close to the rocks. The south and west are
 * clear. (Fairness: rocks may not sit behind or right next to fog; see HAZARDS.fog.)
 */
export const LEVEL_2_4: LevelDef = {
  id: '2-4',
  name: 'White wall',
  region: 'northernIce',
  seed: 2004,
  ships: fleet(1, 4, [
    ['fishing', 'east'],
    ['fishing', 'north'],
    ['cargo', 'south'],
    ['sailboat', 'east'],
    ['fishing', 'west'],
    ['fishing', 'north'],
    ['cargo', 'east'],
    ['fishing', 'south'],
    ['fishing', 'north'],
    ['sailboat', 'east'],
    ['fishing', 'west'],
    ['fishing', 'east'],
  ]),
  reefs: [reef(92, 75), reef(92, 105), reef(95, 355), reef(90, 200), reef(92, 255)],
  hazards: [
    { kind: 'fogBand', ...at(160, 90), angle: bearing(180), length: 220, width: 40 },
    { kind: 'fogBand', ...at(160, 0), angle: bearing(90), length: 200, width: 36 },
  ],
  current: { angle: bearing(270), strength: 2.5 },
  bonus: { kind: 'noLongDark', seconds: 7 },
  stars: DEFAULT_STARS,
};
