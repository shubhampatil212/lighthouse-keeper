import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, wall } from './shape';

/**
 * Region 2, level 3: "The ferry". The first precious ship: lose her and the night is lost.
 * Shape: the ferry comes in from the east down a channel between two rock walls; the other ships
 * arrive around her, so the beam is pulled away just when she needs it.
 */
export const LEVEL_2_3: LevelDef = {
  id: '2-3',
  name: 'The ferry',
  region: 'northernIce',
  seed: 2003,
  ships: [
    ...fleet(1, 4.5, [
      ['fishing', 'north'],
      ['fishing', 'south'],
      ['cargo', 'west'],
    ]),
    { type: 'ferry', at: 14, angle: bearing(90) },
    ...fleet(17, 4, [
      ['fishing', 'north'],
      ['sailboat', 'south'],
      ['fishing', 'west'],
      ['fishing', 'north'],
      ['cargo', 'south'],
      ['fishing', 'west'],
      ['fishing', 'east'],
    ]),
  ],
  reefs: [wall(95, 65, 3), wall(95, 115, 3), wall(96, 270, 2)],
  hazards: [{ kind: 'iceberg', ...at(95, 200), radius: 20, heading: bearing(300), speed: 3 }],
  current: { angle: bearing(250), strength: 2.5 },
  bonus: { kind: 'finishUnder', seconds: 95 },
  stars: DEFAULT_STARS,
};
