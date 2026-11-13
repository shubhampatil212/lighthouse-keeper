import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, fleet, reef } from './shape';

/**
 * Region 4, level 3: "Black sails". One pirate ship hunts ships left in the dark.
 * Shape: open water in the north where the pirate prowls, reefs to the south; drive the pirate off
 * twice for the bonus.
 */
export const LEVEL_4_3: LevelDef = {
  id: '4-3',
  name: 'Black sails',
  region: 'smugglersCove',
  seed: 4003,
  ships: fleet(1, 3.8, [
    ['fishing', 'north'],
    ['fishing', 'south'],
    ['cargo', 'east'],
    ['fishing', 'west'],
    ['sailboat', 'north'],
    ['fishing', 'south'],
    ['fishing', 'east'],
    ['cargo', 'west'],
    ['fishing', 'north'],
    ['fishing', 'south'],
    ['smuggler', 'east'],
    ['fishing', 'west'],
  ]),
  reefs: [reef(92, 120), reef(95, 175), reef(92, 235), reef(98, 290)],
  hazards: [{ kind: 'pirate', at: 6, angle: bearing(20) }],
  current: { angle: bearing(180), strength: 2.5 },
  bonus: { kind: 'driveOffPirates', count: 2 },
  stars: DEFAULT_STARS,
};
