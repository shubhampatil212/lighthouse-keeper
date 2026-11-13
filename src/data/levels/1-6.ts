import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { bearing, reef, wall } from './shape';

/**
 * Region 1, level 6: "First storm", the Harbor Bay finale. Rain, a stronger current, twelve ships.
 * Shape: a crescent of reefs down the windward (south-west) side that the current sweeps ships
 * toward, plus two lone rocks on the far side.
 */
export const LEVEL_1_6: LevelDef = {
  id: '1-6',
  name: 'First storm',
  region: 'harborBay',
  seed: 1006,
  weather: { fog: 0.5, rain: 0.8, snow: 0 },
  ships: [
    { type: 'fishing', at: 1, edge: 'east' },
    { type: 'cargo', at: 5, edge: 'north' },
    { type: 'fishing', at: 10, edge: 'south' },
    { type: 'sailboat', at: 14, edge: 'east' },
    { type: 'fishing', at: 18, edge: 'west' },
    { type: 'fishing', at: 22, edge: 'north' },
    { type: 'cargo', at: 27, edge: 'south' },
    { type: 'sailboat', at: 31, edge: 'west' },
    { type: 'fishing', at: 35, edge: 'east' },
    { type: 'fishing', at: 38, edge: 'north' },
    { type: 'sailboat', at: 42, edge: 'south' },
    { type: 'cargo', at: 46, edge: 'west' },
  ],
  reefs: [wall(96, 180, 3), wall(98, 225, 3), wall(96, 270, 3), reef(92, 40), reef(95, 115)],
  hazards: [],
  current: { angle: bearing(225), strength: 4.2 },
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
};
