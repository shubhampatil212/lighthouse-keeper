import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 3, level 5: "No rest". Lightning, storm waves and a whirlpool together.
 * Shape: the whirlpool sits north-west; reefs lie north-east, east and south-west, so the waves
 * shove ships one way into rock and the other way into the pull.
 */
export const LEVEL_3_5: LevelDef = {
  id: '3-5',
  name: 'No rest',
  region: 'stormStrait',
  seed: 3005,
  ships: fleet(1, 4.4, [
    ['fishing', 'south'],
    ['fishing', 'east'],
    ['cargo', 'north'],
    ['tugboat', 'west'],
    ['fishing', 'south'],
    ['sailboat', 'east'],
    ['fishing', 'north'],
    ['fishing', 'west'],
    ['cargo', 'south'],
    ['fishing', 'east'],
    ['tugboat', 'north'],
    ['fishing', 'south'],
    ['sailboat', 'west'],
    ['fishing', 'east'],
  ]),
  reefs: [reef(85, 110), reef(84, 200), reef(84, 30)],
  hazards: [{ kind: 'lightning' }, { kind: 'stormWaves' }, { kind: 'whirlpool', ...at(108, 305) }],
  current: { angle: bearing(90), strength: 1.5 },
  bonus: { kind: 'noLongDark', seconds: 8 },
  stars: DEFAULT_STARS,
};
