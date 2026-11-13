import { DEFAULT_STARS } from '../stars';
import type { LevelDef } from '../types';
import { at, bearing, fleet, reef, type FleetEntry } from './shape';

const EDGES = ['north', 'east', 'south', 'west'] as const;
const TYPES = ['fishing', 'fishing', 'cargo', 'fishing', 'sailboat', 'fishing'] as const;

/** Thirty ships, round the compass, a mix of types, alternating harbors. */
const LONG_NIGHT: FleetEntry[] = Array.from({ length: 30 }, (_, i) => [
  TYPES[i % TYPES.length] ?? 'fishing',
  EDGES[(i * 3) % EDGES.length] ?? 'north',
  i % 3 === 1 ? 1 : 0,
]);

/**
 * Region 5, level 6: "The longest night", the finale. Thirty ships, two lamps, two harbors,
 * lightning and a pirate. Shape: the second tower and the small harbor face each other across the
 * island (west and east), with rocks in a loose ring and one late pirate.
 */
export const LEVEL_5_6: LevelDef = {
  id: '5-6',
  name: 'The longest night',
  region: 'archipelago',
  seed: 5006,
  weather: { fog: 0.4, rain: 0.4, snow: 0 },
  secondLamp: at(112, 270),
  harbors: [
    { x: 0, y: 0, radius: 38 },
    { ...at(98, 90), radius: 24 },
  ],
  ships: [
    ...fleet(1, 2.6, LONG_NIGHT.slice(0, 10)),
    ...fleet(28, 2.2, LONG_NIGHT.slice(10, 20)),
    ...fleet(52, 2, LONG_NIGHT.slice(20)),
  ],
  reefs: [
    reef(95, 20),
    reef(92, 150),
    reef(160, 255),
    reef(155, 290),
    reef(95, 200),
    reef(90, 330),
  ],
  hazards: [{ kind: 'lightning' }, { kind: 'pirate', at: 45, angle: bearing(180) }],
  current: { angle: bearing(30), strength: 2 },
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
};
