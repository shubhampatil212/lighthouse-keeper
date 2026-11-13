import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 5, level 5: "Everything at once". Two lamps, two harbors, ice, fog, lightning, a pirate and
 * smugglers. Shape: each quarter of the sea has its own trouble: fog in the north, an iceberg in
 * the east, the pirate's water in the south, rocks round the second tower in the west.
 */
export const LEVEL_5_5: LevelDef = {
  id: '5-5',
  name: 'Everything at once',
  region: 'archipelago',
  seed: 5005,
  secondLamp: at(112, 285),
  harbors: [
    { x: 0, y: 0, radius: 38 },
    { ...at(98, 200), radius: 24 },
  ],
  ships: fleet(1, 2.5, [
    ['fishing', 'north', 0],
    ['fishing', 'east', 1],
    ['cargo', 'west', 0],
    ['smuggler', 'south'],
    ['fishing', 'north', 1],
    ['sailboat', 'east', 0],
    ['fishing', 'west', 1],
    ['fishing', 'south', 0],
    ['ferry', 'north', 0],
    ['fishing', 'east', 1],
    ['cargo', 'west', 1],
    ['smuggler', 'north'],
    ['fishing', 'south', 0],
    ['fishing', 'east', 0],
    ['sailboat', 'west', 1],
    ['fishing', 'north', 0],
  ]),
  reefs: [
    reef(160, 290),
    reef(150, 260),
    reef(92, 330),
    reef(92, 150),
    reef(95, 240),
    reef(92, 40),
  ],
  hazards: [
    { kind: 'fogBand', ...at(130, 10), angle: bearing(90), length: 180, width: 34 },
    { kind: 'iceberg', ...at(90, 80), radius: 22, heading: bearing(10), speed: 4 },
    { kind: 'lightning' },
    { kind: 'pirate', at: 12, angle: bearing(170) },
  ],
  current: { angle: bearing(90), strength: 2 },
  bonus: { kind: 'catchSmugglers', count: 'all' },
  stars: DEFAULT_STARS,
};
