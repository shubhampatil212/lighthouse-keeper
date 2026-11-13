import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef, wall } from './shape';

/**
 * Region 3, level 3: "The maelstrom". A whirlpool in the east.
 * Shape: the eastern approach splits round the whirlpool; a reef wall to its north closes one side,
 * so ships must be lit through the narrow southern gap. The west is open water with two reefs.
 */
export const LEVEL_3_3: LevelDef = {
  id: '3-3',
  name: 'The maelstrom',
  region: 'stormStrait',
  seed: 3003,
  ships: fleet(1, 3.8, [
    ['fishing', 90],
    ['fishing', 'west'],
    ['cargo', 70],
    ['fishing', 'north'],
    ['sailboat', 110],
    ['fishing', 'south'],
    ['fishing', 85],
    ['cargo', 'west'],
    ['fishing', 100],
    ['fishing', 'north'],
    ['sailboat', 75],
    ['fishing', 'south'],
  ]),
  reefs: [wall(92, 45, 3), reef(92, 230), reef(95, 310)],
  hazards: [{ kind: 'whirlpool', ...at(112, 92) }, { kind: 'lightning' }],
  current: { angle: bearing(270), strength: 2 },
  bonus: { kind: 'savedTogether', count: 3, within: 8 },
  stars: DEFAULT_STARS,
};
