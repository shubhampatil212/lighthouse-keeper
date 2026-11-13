import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, reef } from './shape';

/**
 * Region 1, level 5: "Rush hour". Faster spawning: ten ships about four seconds apart.
 * Shape: a ring of reefs round the island with three clear lanes (north-east, south, west).
 */
export const LEVEL_1_5: LevelDef = {
  id: '1-5',
  name: 'Rush hour',
  region: 'harborBay',
  seed: 1005,
  ships: [
    { type: 'fishing', at: 1, edge: 'north' },
    { type: 'fishing', at: 5, edge: 'south' },
    { type: 'cargo', at: 9, edge: 'west' },
    { type: 'fishing', at: 13, edge: 'east' },
    { type: 'sailboat', at: 17, edge: 'north' },
    { type: 'fishing', at: 21, edge: 'south' },
    { type: 'fishing', at: 24, edge: 'east' },
    { type: 'cargo', at: 28, edge: 'west' },
    { type: 'fishing', at: 32, edge: 'north' },
    { type: 'sailboat', at: 35, edge: 'south' },
  ],
  reefs: [reef(92, 0), reef(95, 90), reef(90, 130), reef(92, 225), reef(95, 315), reef(90, 160)],
  hazards: [],
  current: { angle: bearing(60), strength: 3 },
  bonus: { kind: 'savedTogether', count: 3, within: 10 },
  stars: DEFAULT_STARS,
};
