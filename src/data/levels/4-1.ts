import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef } from './shape';

/**
 * Region 4, level 1: "Shadows on the water". Smugglers: lanterns dim, they turn away from the light.
 * Hold one in the beam for 2 s to catch it. Shape: smugglers cut across the north; honest traffic
 * comes from the south past a line of three reefs.
 */
export const LEVEL_4_1: LevelDef = {
  id: '4-1',
  name: 'Shadows on the water',
  region: 'smugglersCove',
  seed: 4001,
  ships: fleet(1, 4, [
    ['fishing', 'south'],
    ['smuggler', 300],
    ['fishing', 'east'],
    ['cargo', 'south'],
    ['fishing', 'west'],
    ['smuggler', 60],
    ['fishing', 'south'],
    ['sailboat', 'east'],
    ['fishing', 'west'],
    ['smuggler', 340],
    ['fishing', 'south'],
  ]),
  reefs: [reef(92, 140), reef(95, 180), reef(92, 220), reef(90, 60), reef(92, 300)],
  hazards: [],
  current: { angle: bearing(90), strength: 2.5 },
  bonus: { kind: 'catchSmugglers', count: 2 },
  stars: DEFAULT_STARS,
};
