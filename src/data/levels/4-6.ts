import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef, wall } from './shape';

/**
 * Region 4, level 6: "The pirate king", the Smugglers' Cove finale. Two pirates, smugglers and
 * fourteen honest ships. Shape: the pirates come in from opposite sides; a reef wall guards the
 * north and the south has scattered rocks.
 */
export const LEVEL_4_6: LevelDef = {
  id: '4-6',
  name: 'The pirate king',
  region: 'smugglersCove',
  seed: 4006,
  ships: fleet(1, 3.3, [
    ['fishing', 'north'],
    ['fishing', 'south'],
    ['cargo', 'east'],
    ['fishing', 'west'],
    ['smuggler', 'north'],
    ['sailboat', 'south'],
    ['fishing', 'east'],
    ['fishing', 'west'],
    ['cargo', 'north'],
    ['fishing', 'south'],
    ['smuggler', 'east'],
    ['fishing', 'west'],
    ['ferry', 'south'],
    ['fishing', 'north'],
    ['sailboat', 'east'],
    ['fishing', 'west'],
  ]),
  reefs: [wall(96, 330, 3), wall(96, 30, 3), reef(92, 150), reef(95, 210), reef(90, 100)],
  hazards: [
    { kind: 'pirate', at: 5, angle: bearing(80) },
    { kind: 'pirate', at: 22, angle: bearing(260) },
  ],
  current: { angle: bearing(0), strength: 2.5 },
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
};
