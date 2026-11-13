import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 4, level 5: "Moonless". No moon: fog bands shorten the beam on three sides and there are
 * more reefs than anywhere yet. Shape: a full ring of six reefs inside a broken ring of fog. (A
 * ring of eight left gaps too narrow for a cargo ship, which then circled forever.)
 */
export const LEVEL_4_5: LevelDef = {
  id: '4-5',
  name: 'Moonless',
  region: 'smugglersCove',
  seed: 4005,
  weather: { fog: 0.9, rain: 0, snow: 0 },
  ships: fleet(1, 3.6, [
    ['fishing', 'north'],
    ['fishing', 'east'],
    ['cargo', 'south'],
    ['smuggler', 'west'],
    ['fishing', 'north'],
    ['sailboat', 'east'],
    ['fishing', 'south'],
    ['fishing', 'west'],
    ['cargo', 'north'],
    ['fishing', 'east'],
    ['smuggler', 'south'],
    ['fishing', 'west'],
    ['fishing', 'north'],
  ]),
  reefs: [reef(92, 20), reef(95, 80), reef(92, 140), reef(95, 200), reef(92, 260), reef(95, 320)],
  hazards: [
    { kind: 'fogBand', ...at(160, 30), angle: bearing(120), length: 160, width: 34 },
    { kind: 'fogBand', ...at(160, 150), angle: bearing(240), length: 160, width: 34 },
    { kind: 'fogBand', ...at(160, 270), angle: bearing(0), length: 160, width: 34 },
  ],
  current: { angle: bearing(300), strength: 2 },
  bonus: { kind: 'savedTogether', count: 3, within: 8 },
  stars: DEFAULT_STARS,
};
