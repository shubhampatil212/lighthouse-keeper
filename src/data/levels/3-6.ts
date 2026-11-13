import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 3, level 6: "The great storm", the Storm Strait finale. Everything the strait has, sixteen
 * ships, and the bonus asks you to ride it out without a flare.
 * Shape: the whirlpool guards the east, reefs the north, south-west and west, so every lane
 * passes near one danger or the other.
 */
export const LEVEL_3_6: LevelDef = {
  id: '3-6',
  name: 'The great storm',
  region: 'stormStrait',
  seed: 3006,
  weather: { fog: 0.6, rain: 1, snow: 0 },
  ships: fleet(1, 4, [
    ['fishing', 'north'],
    ['cargo', 'south'],
    ['fishing', 'east'],
    ['tugboat', 'west'],
    ['fishing', 'north'],
    ['sailboat', 'south'],
    ['fishing', 'east'],
    ['cargo', 'west'],
    ['fishing', 'north'],
    ['fishing', 'south'],
    ['tugboat', 'east'],
    ['fishing', 'west'],
    ['sailboat', 'north'],
    ['cargo', 'south'],
    ['fishing', 'east'],
    ['fishing', 'west'],
  ]),
  reefs: [reef(85, 15), reef(84, 200), reef(86, 280)],
  hazards: [{ kind: 'lightning' }, { kind: 'stormWaves' }, { kind: 'whirlpool', ...at(108, 90) }],
  current: { angle: bearing(180), strength: 1.5 },
  bonus: { kind: 'noAbility', ability: 'flare' },
  stars: DEFAULT_STARS,
};
