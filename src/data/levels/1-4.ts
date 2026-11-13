import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, reef } from './shape';

/**
 * Region 1, level 4: "Offshore breeze". Sailboats, and a current you can see.
 * Shape: traffic from the west only, with the breeze blowing from the land out to sea (east).
 * Reefs sit on the east side too, where the breeze carries a drifting sailboat past the island.
 */
export const LEVEL_1_4: LevelDef = {
  id: '1-4',
  name: 'Offshore breeze',
  region: 'harborBay',
  seed: 1004,
  ships: [
    { type: 'sailboat', at: 1, angle: bearing(270) },
    { type: 'fishing', at: 7, angle: bearing(235) },
    { type: 'sailboat', at: 14, angle: bearing(305) },
    { type: 'fishing', at: 20, angle: bearing(250) },
    { type: 'sailboat', at: 27, angle: bearing(290) },
    { type: 'cargo', at: 33, angle: bearing(215) },
    { type: 'sailboat', at: 40, angle: bearing(325) },
    { type: 'sailboat', at: 46, angle: bearing(260) },
  ],
  reefs: [reef(90, 240), reef(95, 300), reef(88, 50), reef(90, 125), reef(100, 180)],
  hazards: [],
  current: { angle: bearing(90), strength: 4 },
  bonus: { kind: 'finishUnder', seconds: 90 },
  stars: DEFAULT_STARS,
};
