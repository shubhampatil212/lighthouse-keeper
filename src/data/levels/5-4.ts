import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef } from './shape';

/**
 * Region 5, level 4: "Festival night". Heavy traffic: twenty ships, about two and a half seconds
 * apart. Shape: few rocks, but every boat in the islands is out; two lamps and two harbors share
 * the work.
 */
export const LEVEL_5_4: LevelDef = {
  id: '5-4',
  name: 'Festival night',
  region: 'archipelago',
  seed: 5004,
  weather: { fog: 0.2, rain: 0, snow: 0 },
  secondLamp: at(112, 240),
  harbors: [
    { x: 0, y: 0, radius: 38 },
    { ...at(98, 100), radius: 24 },
  ],
  ships: fleet(1, 2, [
    ['fishing', 'north', 0],
    ['fishing', 'east', 1],
    ['sailboat', 'south', 1],
    ['fishing', 'west', 0],
    ['fishing', 'north', 1],
    ['cargo', 'south', 0],
    ['fishing', 'east', 0],
    ['fishing', 'west', 0],
    ['sailboat', 'north', 1],
    ['fishing', 'south', 1],
    ['fishing', 'east', 0],
    ['tugboat', 'west', 0],
    ['fishing', 'north', 0],
    ['cargo', 'east', 1],
    ['fishing', 'south', 0],
    ['fishing', 'west', 1],
    ['sailboat', 'north', 0],
    ['fishing', 'east', 1],
    ['fishing', 'south', 0],
    ['fishing', 'west', 0],
  ]),
  reefs: [reef(95, 30), reef(92, 160), reef(160, 245), reef(95, 320), reef(92, 200), reef(95, 280)],
  hazards: [],
  current: { angle: bearing(60), strength: 2 },
  bonus: { kind: 'savedTogether', count: 4, within: 8 },
  stars: DEFAULT_STARS,
};
