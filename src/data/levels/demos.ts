import { DEFAULT_STARS } from '../stars';
import type { LevelDef, Upgrades } from '../types';
import { LEVEL_1_2 } from './1-2';

/**
 * Debug-only demo nights (open with ?level=demo-ice and so on), one per group of phase 04 elements,
 * for looking at them in play before the campaign levels exist (phase 06). Not part of the campaign.
 */
const demo = (id: string, name: string, overrides: Partial<LevelDef>): LevelDef => ({
  ...LEVEL_1_2,
  id: `demo-${id}`,
  name,
  bonus: { kind: 'none' },
  stars: DEFAULT_STARS,
  ...overrides,
});

export const DEMO_LEVELS: Readonly<Record<string, LevelDef>> = {
  'demo-ice': demo('ice', 'Demo: fog bands and icebergs', {
    region: 'northernIce',
    hazards: [
      { kind: 'fogBand', x: 0, y: -160, angle: 0, length: 170, width: 34 },
      { kind: 'fogBand', x: 160, y: 40, angle: Math.PI / 2 + 0.3, length: 150, width: 30 },
      { kind: 'iceberg', x: 85, y: 70 },
      { kind: 'iceberg', x: -75, y: -75 },
    ],
    ships: [
      ...LEVEL_1_2.ships,
      { type: 'sailboat', at: 12, edge: 'north' },
      { type: 'ferry', at: 26, edge: 'south' },
    ],
  }),
  'demo-storm': demo('storm', 'Demo: lightning, waves and a whirlpool', {
    region: 'stormStrait',
    // Storm-wave levels keep reefs further in (HAZARDS.stormWaves.extraReefMargin).
    reefs: [
      { x: 26, y: -96 },
      { x: -94, y: 24 },
      { x: 108, y: 33 },
      { x: -32, y: 95 },
    ],
    hazards: [{ kind: 'lightning' }, { kind: 'stormWaves' }, { kind: 'whirlpool', x: 85, y: -70 }],
    ships: [...LEVEL_1_2.ships, { type: 'tugboat', at: 5, edge: 'west' }],
  }),
  'demo-cove': demo('cove', 'Demo: smugglers and pirates', {
    region: 'smugglersCove',
    hazards: [
      { kind: 'pirate', at: 4, angle: 0.3 },
      { kind: 'pirate', at: 20, angle: Math.PI + 0.4 },
    ],
    ships: [
      ...LEVEL_1_2.ships,
      { type: 'smuggler', at: 6, edge: 'east' },
      { type: 'smuggler', at: 18, edge: 'north' },
    ],
  }),
  'demo-archipelago': demo('archipelago', 'Demo: two harbors and a second lamp', {
    region: 'archipelago',
    harbors: [
      { x: 0, y: 0, radius: 38 },
      { x: -85, y: -62, radius: 24 },
    ],
    secondLamp: { x: 100, y: -85 },
    ships: LEVEL_1_2.ships.map((ship, i) => ({ ...ship, harbor: i % 2 })),
  }),
};

/** Upgrades for the demos, so the foghorn and flares can be tried (no shop until phase 05). */
export const DEMO_UPGRADES: Upgrades = {
  lens: 0,
  lamp: 0,
  gears: 0,
  foghorn: 1,
  flares: 3,
  buoys: [],
};
