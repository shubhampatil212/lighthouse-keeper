import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef } from './shape';

/**
 * Region 3, level 1: "Flash of white". Lightning, and the flare tutorial (one flare is lent).
 * Shape: five reefs spread round the compass, more than one sweep can remember. Lightning shows the whole
 * field for a moment; the flare does it when you choose.
 */
export const LEVEL_3_1: LevelDef = {
  id: '3-1',
  name: 'Flash of white',
  region: 'stormStrait',
  seed: 3001,
  loan: { flares: 1 },
  ships: fleet(1, 4.4, [
    ['fishing', 'north'],
    ['fishing', 'south'],
    ['cargo', 'east'],
    ['fishing', 'west'],
    ['sailboat', 'north'],
    ['fishing', 'east'],
    ['fishing', 'south'],
    ['cargo', 'west'],
    ['fishing', 'north'],
    ['sailboat', 'east'],
    ['fishing', 'south'],
    ['fishing', 'west'],
  ]),
  reefs: [reef(92, 20), reef(98, 95), reef(92, 170), reef(95, 245), reef(90, 315)],
  hazards: [{ kind: 'lightning' }],
  current: { angle: bearing(120), strength: 2.5 },
  bonus: { kind: 'noLongDark', seconds: 7 },
  stars: DEFAULT_STARS,
};
