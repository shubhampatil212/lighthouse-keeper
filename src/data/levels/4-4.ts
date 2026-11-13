import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef, wall } from './shape';

/**
 * Region 4, level 4: "Escort". The ferry has to come in past a pirate.
 * Shape: the pirate arrives from the west just before the ferry; the ferry's lane from the
 * south-west runs between two reef walls, so she can't be left to drift either.
 */
export const LEVEL_4_4: LevelDef = {
  id: '4-4',
  name: 'Escort',
  region: 'smugglersCove',
  seed: 4004,
  ships: [
    ...fleet(1, 3.8, [
      ['fishing', 'north'],
      ['fishing', 'east'],
      ['cargo', 'south'],
      ['fishing', 'north'],
    ]),
    { type: 'ferry', at: 18, angle: bearing(225) },
    ...fleet(21, 3.8, [
      ['fishing', 'east'],
      ['smuggler', 'north'],
      ['fishing', 'south'],
      ['sailboat', 'east'],
      ['fishing', 'north'],
      ['cargo', 'east'],
      ['fishing', 'south'],
    ]),
  ],
  reefs: [wall(96, 195, 3), wall(96, 255, 3), reef(92, 30), reef(94, 120)],
  hazards: [{ kind: 'pirate', at: 14, angle: bearing(270) }],
  current: { angle: bearing(45), strength: 2.5 },
  bonus: { kind: 'noLongDark', seconds: 8 },
  stars: DEFAULT_STARS,
};
