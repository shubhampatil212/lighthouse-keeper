import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 2, level 2: "Drifting giants". Two icebergs, and little else.
 * Shape: open water with just two small reefs; the danger moves. The bergs drift slowly across
 * the east and west approaches.
 */
export const LEVEL_2_2: LevelDef = {
  id: '2-2',
  name: 'Drifting giants',
  region: 'northernIce',
  seed: 2002,
  ships: fleet(1, 4.5, [
    ['fishing', 'east'],
    ['fishing', 'west'],
    ['cargo', 'north'],
    ['fishing', 'east'],
    ['sailboat', 'south'],
    ['fishing', 'west'],
    ['cargo', 'east'],
    ['fishing', 'north'],
    ['fishing', 'west'],
    ['sailboat', 'east'],
  ]),
  reefs: [reef(92, 0), reef(94, 180)],
  hazards: [
    { kind: 'iceberg', ...at(90, 80), radius: 24, heading: bearing(170), speed: 4 },
    { kind: 'iceberg', ...at(92, 265), radius: 22, heading: bearing(10), speed: 4 },
  ],
  current: { angle: bearing(30), strength: 2.5 },
  bonus: { kind: 'noLongDark', seconds: 7 },
  stars: DEFAULT_STARS,
};
