import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, wall } from './shape';

/**
 * Region 1, level 3: "Two at once". Ships arrive in pairs from opposite sides.
 * Shape: a reef wall across the east and the west approaches, each with a gap straight in, so a
 * ship left drifting meets rock whichever side it comes from.
 */
export const LEVEL_1_3: LevelDef = {
  id: '1-3',
  name: 'Two at once',
  region: 'harborBay',
  seed: 1003,
  ships: [
    { type: 'fishing', at: 1, angle: bearing(90) },
    { type: 'fishing', at: 1, angle: bearing(270) },
    { type: 'fishing', at: 15, angle: bearing(70) },
    { type: 'cargo', at: 15, angle: bearing(250) },
    { type: 'fishing', at: 30, angle: bearing(110) },
    { type: 'fishing', at: 30, angle: bearing(290) },
    { type: 'cargo', at: 45, angle: bearing(80) },
    { type: 'fishing', at: 45, angle: bearing(260) },
  ],
  reefs: [wall(98, 62, 2), wall(98, 118, 2), wall(98, 242, 2), wall(98, 298, 2)],
  hazards: [],
  current: { angle: bearing(0), strength: 3 },
  bonus: { kind: 'noLongDark', seconds: 6 },
  stars: DEFAULT_STARS,
};
