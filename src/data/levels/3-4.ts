import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef } from './shape';

/**
 * Region 3, level 4: "Crosswaves". Storm waves push every ship, lit or not, and change direction.
 * Shape: a tight inner ring of four reefs (storm-wave rules keep rocks closer in), so a pushed ship
 * is never far from rock; the gaps line up with the four compass points.
 */
export const LEVEL_3_4: LevelDef = {
  id: '3-4',
  name: 'Crosswaves',
  region: 'stormStrait',
  seed: 3004,
  ships: fleet(1, 4.6, [
    ['fishing', 'north'],
    ['cargo', 'east'],
    ['fishing', 'south'],
    ['fishing', 'west'],
    ['sailboat', 'north'],
    ['fishing', 'east'],
    ['tugboat', 'south'],
    ['fishing', 'west'],
    ['cargo', 'north'],
    ['fishing', 'east'],
    ['fishing', 'south'],
    ['sailboat', 'west'],
  ]),
  reefs: [reef(84, 45), reef(86, 135), reef(84, 225), reef(86, 315)],
  hazards: [{ kind: 'stormWaves' }, { kind: 'lightning' }],
  current: { angle: bearing(0), strength: 1.5 },
  bonus: { kind: 'finishUnder', seconds: 85 },
  stars: DEFAULT_STARS,
};
