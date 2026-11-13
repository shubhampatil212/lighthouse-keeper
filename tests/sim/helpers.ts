/** Shared helpers for simulation tests: scripted players and a runner. */
import {
  ABILITIES,
  HAZARDS,
  ISLAND,
  NO_UPGRADES,
  SEA,
  SHIP_BEHAVIOR,
  SHIP_TYPES,
  SMUGGLER,
  TUG,
} from '../../src/data';
import type { DifficultyId, HarborDef, LevelDef, Upgrades } from '../../src/data/types';
import {
  NO_INTENTS,
  createWorld,
  wrapAngle,
  type Intents,
  type LightOrigin,
  type Rock,
  type ShipRules,
  type SimEvent,
  type World,
  type WorldOptions,
} from '../../src/sim';

export const DT = 1 / 60;

/** A scripted player: given the world, returns where to aim (or null to leave the beam alone). */
export type Player = (world: World) => number | null;

export const aimAt = (angle: number | null): Intents =>
  angle === null ? NO_INTENTS : { ...NO_INTENTS, aimAngle: wrapAngle(angle) };

/** Lazy player 1: never touches the beam. */
export const frozenPlayer: Player = () => null;

/** Lazy player 2: sweeps slowly round and round, ignoring the ships. */
export const sweepingPlayer: Player = (world) => world.state.beam.angle + 0.3;

/** A busy player: always aims at the ship that has been at sea longest. */
export const chasingPlayer: Player = (world) => {
  const ship = world.state.ships[0];
  return ship ? Math.atan2(ship.y, ship.x) : null;
};

export function step(world: World, player: Player): void {
  world.step(DT, aimAt(player(world)));
}

export interface RunResult {
  world: World;
  events: SimEvent[];
}

/** Plays a night to the end (or a time cap) and returns every event. */
export function playNight(
  level: LevelDef,
  difficulty: DifficultyId,
  seed: number,
  player: Player,
  upgrades: Upgrades = NO_UPGRADES,
  maxSeconds = 600,
  options: WorldOptions = {},
): RunResult {
  const world = createWorld(level, difficulty, upgrades, seed, options);
  const events: SimEvent[] = [];
  while (world.state.status === 'playing' && world.state.tick < maxSeconds * 60) {
    step(world, player);
    events.push(...world.drainEvents());
  }
  return { world, events };
}

/** A small level for unit tests; override any part. */
export function testLevel(overrides: Partial<LevelDef> = {}): LevelDef {
  return {
    id: 'test',
    name: 'Test night',
    region: 'harborBay',
    seed: 7,
    ships: [{ type: 'fishing', at: 0, angle: 0 }],
    reefs: [],
    hazards: [],
    current: { angle: 0, strength: 0 },
    bonus: { kind: 'none' },
    stars: { twoStarMaxWrecks: 1, threeStarMaxWrecks: 0 },
    ...overrides,
  };
}

/** Ship rules built from the real data, with a chosen current and harbors. */
export function shipRules(
  currentX = 0,
  currentY = 0,
  harbors: readonly HarborDef[] = [{ x: 0, y: 0, radius: SEA.defaultHarborRadius }],
): ShipRules {
  return {
    behavior: SHIP_BEHAVIOR,
    types: SHIP_TYPES,
    sea: SEA,
    harbors,
    currentX,
    currentY,
    islandRadius: ISLAND.radius,
    smuggler: SMUGGLER,
    tug: TUG,
    whirlpool: HAZARDS.whirlpool,
    icebergHeadOnCos: HAZARDS.iceberg.headOnCos,
    foghornSpeedFactor: ABILITIES.foghorn.speedFactor,
  };
}

/** Light functions for ship tests: everything lit from the island, or nothing lit. */
export const lit = (): LightOrigin => ({ x: 0, y: 0 });
export const dark = (): LightOrigin | null => null;

/** A plain rock for tests. */
export const rock = (x: number, y: number, r: number, reef = 0): Rock => ({
  kind: 'rock',
  x,
  y,
  r,
  vx: 0,
  vy: 0,
  reef,
  memory: 0,
  lit: false,
});
