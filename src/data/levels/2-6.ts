import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef, wall } from './shape';

/**
 * Region 2, level 6: "Polar night", the Northern Ice finale. Fog, icebergs, a ferry, fourteen ships.
 * Shape: a fog bank over the west, bergs drifting through the north and south, and a rock wall in
 * the east where the ferry comes in.
 */
export const LEVEL_2_6: LevelDef = {
  id: '2-6',
  name: 'Polar night',
  region: 'northernIce',
  seed: 2006,
  weather: { fog: 0.8, rain: 0, snow: 0.9 },
  ships: [
    ...fleet(1, 3.6, [
      ['fishing', 'west'],
      ['cargo', 'north'],
      ['fishing', 'south'],
      ['sailboat', 'west'],
      ['fishing', 'east'],
      ['fishing', 'north'],
      ['cargo', 'south'],
    ]),
    { type: 'ferry', at: 27, angle: bearing(95) },
    ...fleet(30, 3.6, [
      ['fishing', 'west'],
      ['fishing', 'north'],
      ['sailboat', 'south'],
      ['fishing', 'east'],
      ['cargo', 'west'],
      ['fishing', 'north'],
    ]),
  ],
  reefs: [wall(97, 60, 3), wall(97, 125, 3), reef(82, 235)],
  hazards: [
    { kind: 'fogBand', ...at(160, 270), angle: bearing(0), length: 220, width: 40 },
    { kind: 'iceberg', ...at(90, 0), radius: 22, heading: bearing(270), speed: 4 },
    { kind: 'iceberg', ...at(92, 190), radius: 24, heading: bearing(80), speed: 4 },
  ],
  current: { angle: bearing(200), strength: 2.5 },
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
};
