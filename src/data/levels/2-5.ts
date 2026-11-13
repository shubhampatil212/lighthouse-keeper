import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 2, level 5: "Calving season". Four icebergs and one reef.
 * Shape: a moving maze: four bergs drifting in a loose ring, so the safe lanes change all night.
 */
export const LEVEL_2_5: LevelDef = {
  id: '2-5',
  name: 'Calving season',
  region: 'northernIce',
  seed: 2005,
  ships: fleet(1, 4, [
    ['fishing', 'north'],
    ['cargo', 'east'],
    ['fishing', 'south'],
    ['fishing', 'west'],
    ['sailboat', 'north'],
    ['cargo', 'south'],
    ['fishing', 'east'],
    ['fishing', 'west'],
    ['ferry', 'north'],
    ['fishing', 'south'],
    ['cargo', 'east'],
    ['fishing', 'west'],
  ]),
  reefs: [reef(95, 225)],
  hazards: [
    { kind: 'iceberg', ...at(90, 30), radius: 22, heading: bearing(120), speed: 4 },
    { kind: 'iceberg', ...at(92, 120), radius: 20, heading: bearing(210), speed: 4 },
    { kind: 'iceberg', ...at(90, 300), radius: 24, heading: bearing(30), speed: 3.5 },
    { kind: 'iceberg', ...at(94, 170), radius: 18, heading: bearing(300), speed: 5 },
  ],
  current: { angle: bearing(100), strength: 2 },
  bonus: { kind: 'saveAllOfType', type: 'cargo' },
  stars: { ...DEFAULT_STARS, threeStarMaxWrecks: 1 },
};
