/**
 * Test-only levels: level 1-2's layout with one phase 04 element added each, so the fairness test
 * can check every hazard and special ship on its own. (Real campaign levels arrive in phase 06.)
 */
import { HAZARDS, LEVEL_1_2 } from '../../src/data';
import type { HazardDef, LevelDef, ReefDef, ShipSpawnDef } from '../../src/data/types';
import type { WreckCause } from '../../src/sim';

/** Moves a reef `by` world units toward the island. */
const pullIn = (reef: ReefDef, by: number): ReefDef => {
  const d = Math.hypot(reef.x, reef.y);
  return { ...reef, x: (reef.x * (d - by)) / d, y: (reef.y * (d - by)) / d };
};

const variant = (id: string, overrides: Partial<LevelDef>): LevelDef => ({
  ...LEVEL_1_2,
  id: `1-2+${id}`,
  name: `${LEVEL_1_2.name} with ${id}`,
  bonus: { kind: 'none' },
  ...overrides,
});

const withHazards = (id: string, hazards: readonly HazardDef[]): LevelDef =>
  variant(id, { hazards });

const SPECIAL_SHIPS: readonly ShipSpawnDef[] = [
  { type: 'sailboat', at: 1.5, edge: 'north' },
  { type: 'tugboat', at: 6, edge: 'west' },
  { type: 'cargo', at: 7, edge: 'west' },
  { type: 'smuggler', at: 12, edge: 'east' },
  { type: 'sailboat', at: 18, edge: 'south' },
  { type: 'ferry', at: 24, edge: 'east' },
  { type: 'smuggler', at: 30, edge: 'north' },
  { type: 'fishing', at: 36, edge: 'west' },
];

/** Seeds per hazard level in the fairness run (fewer than a campaign level: there are many of them). */
export const HAZARD_SEEDS = 40;

/** Levels whose hazard sinks ships itself, and the wreck cause the fairness run must actually see. */
export const HAZARD_CAUSES: Readonly<Record<string, WreckCause>> = {
  '1-2+icebergs': 'iceberg',
  '1-2+whirlpool': 'whirlpool',
  '1-2+pirates': 'pirate',
};

export const HAZARD_LEVELS: readonly LevelDef[] = [
  withHazards('fog', [
    { kind: 'fogBand', x: 0, y: -165, angle: 0, length: 170, width: 34 },
    { kind: 'fogBand', x: 160, y: 40, angle: Math.PI / 2 + 0.3, length: 150, width: 30 },
  ]),
  withHazards('icebergs', [
    { kind: 'iceberg', x: 85, y: 70 },
    { kind: 'iceberg', x: -75, y: -75 },
  ]),
  withHazards('lightning', [{ kind: 'lightning' }]),
  variant('storm waves', {
    hazards: [{ kind: 'stormWaves' }],
    // Storm-wave levels keep reefs HAZARDS.stormWaves.extraReefMargin further in.
    reefs: LEVEL_1_2.reefs.map((reef) => pullIn(reef, HAZARDS.stormWaves.extraReefMargin)),
  }),
  withHazards('whirlpool', [{ kind: 'whirlpool', x: 95, y: -80 }]),
  withHazards('pirates', [
    { kind: 'pirate', at: 4, angle: 0.3 },
    { kind: 'pirate', at: 20, angle: Math.PI + 0.4 },
  ]),
  variant('special ships', { ships: SPECIAL_SHIPS }),
  variant('two harbors', {
    harbors: [
      { x: 0, y: 0, radius: 38 },
      { x: -85, y: -62, radius: 24 },
    ],
    secondLamp: { x: 100, y: -85 },
    ships: LEVEL_1_2.ships.map((ship, i) => ({ ...ship, harbor: i % 2 })),
  }),
];
