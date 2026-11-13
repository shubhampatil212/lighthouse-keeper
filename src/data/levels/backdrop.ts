import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';

/** The empty sea behind the menus: the island and a slowly sweeping beam, no ships or reefs. */
export const BACKDROP_LEVEL: LevelDef = {
  id: 'backdrop',
  name: '',
  region: 'harborBay',
  seed: 1,
  ships: [],
  reefs: [],
  hazards: [],
  current: { angle: 0, strength: 0 },
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
};
