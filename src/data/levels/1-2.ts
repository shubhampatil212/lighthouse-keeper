import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';

/**
 * Region 1, level 2: "The cargo run" (docs/CONTENT.md §6).
 * Introduces the slow cargo ship. Six ships about 7 s apart; one reef sits across each approach.
 * Angles: 0 = east, PI/2 = south (screen y grows downward).
 */
export const LEVEL_1_2: LevelDef = {
  id: '1-2',
  name: 'The cargo run',
  region: 'harborBay',
  seed: 1002,
  ships: [
    { type: 'fishing', at: 1.5, edge: 'north' },
    { type: 'cargo', at: 8, edge: 'west' },
    { type: 'fishing', at: 15, edge: 'east' },
    { type: 'fishing', at: 22, edge: 'south' },
    { type: 'cargo', at: 30, edge: 'east' },
    { type: 'fishing', at: 38, edge: 'west' },
  ],
  reefs: [
    { x: 30, y: -110 },
    { x: -108, y: 27 },
    { x: 124, y: 38 },
    { x: -37, y: 109 },
  ],
  hazards: [],
  current: { angle: 0.6, strength: 4 },
  bonus: { kind: 'saveAllOfType', type: 'cargo' },
  stars: DEFAULT_STARS,
};
