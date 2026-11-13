import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef, wall } from './shape';

/**
 * Region 4, level 2: "Contraband". Five smugglers; the bonus is to catch every one.
 * Shape: the cove's mouth: a rock wall across the east with honest ships threading its gap, while
 * smugglers slip in from every side. Chasing one leaves the others in the dark.
 */
export const LEVEL_4_2: LevelDef = {
  id: '4-2',
  name: 'Contraband',
  region: 'smugglersCove',
  seed: 4002,
  ships: fleet(1, 3.8, [
    ['fishing', 90],
    ['smuggler', 'north'],
    ['fishing', 'west'],
    ['cargo', 85],
    ['smuggler', 'south'],
    ['fishing', 'north'],
    ['smuggler', 'west'],
    ['fishing', 95],
    ['sailboat', 'south'],
    ['smuggler', 'east'],
    ['fishing', 'west'],
    ['smuggler', 'north'],
    ['fishing', 90],
  ]),
  reefs: [
    wall(96, 60, 3),
    wall(96, 120, 3),
    reef(92, 0),
    reef(90, 220),
    reef(92, 170),
    reef(95, 290),
  ],
  hazards: [],
  current: { angle: bearing(250), strength: 2.5 },
  bonus: { kind: 'catchSmugglers', count: 'all' },
  stars: DEFAULT_STARS,
};
