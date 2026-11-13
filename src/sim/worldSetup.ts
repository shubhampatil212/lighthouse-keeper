/**
 * Everything fixed for a night, worked out once from (level, difficulty, upgrades, seed), and the
 * night's starting state. world.ts advances that state; this file only builds it.
 */
import { ABILITIES } from '../data/abilities';
import { BEAM, BEAM_FEEL, BEAM_UPGRADES } from '../data/beam';
import { DIFFICULTIES } from '../data/difficulties';
import { HAZARDS } from '../data/hazards';
import { ISLAND } from '../data/island';
import { LOOP } from '../data/loop';
import { SEA } from '../data/sea';
import { SHIP_BEHAVIOR } from '../data/shipBehavior';
import { SHIP_TYPES, SMUGGLER, TUG } from '../data/ships';
import { ENDLESS } from '../data/endless';
import type {
  DifficultyConfig,
  DifficultyId,
  HarborDef,
  LevelDef,
  Upgrades,
  WatchDef,
} from '../data/types';
import { startAbilities, type AbilityState, type LampState } from './abilities';
import { beamStats, type BeamState, type BeamStats, type BuoyLight } from './beam';
import type { Tow } from './coastGuard';
import { startWatch, type WatchState } from './endless';
import type { LevelResult, SimEvent } from './events';
import type { FogBand } from './fog';
import { createObjective, type BonusObjective, type ObjectiveProgress } from './objectives';
import type { Pirate, PirateRules } from './pirates';
import { buildReefs, buildRocks, type Reef, type Rock } from './reefs';
import { createRng } from './rng';
import type { Ship, ShipRules, WakePoint } from './ships';
import { planPirates, planSpawns, type PirateOrder, type SpawnOrder } from './spawner';
import { startLightning, startWaves, type LightningState, type WavesState } from './storms';

export type WorldStatus = 'playing' | 'won' | 'failed';

export interface WorldOptions {
  /** The night never ends on its own (the sandbox and the menu backdrop). */
  endless?: boolean;
  /** An endless watch: ships, reefs and hazards keep coming until wrecks pass the allowance. */
  watch?: WatchDef;
}

/** Everything that changes during a night. Plain data only, so a night can be copied and replayed. */
export interface WorldState {
  seed: number;
  tick: number;
  /** Seconds since the night began. */
  time: number;
  status: WorldStatus;
  /** Random stream for ship spawns. */
  rngState: number;
  /** Random stream for hazards (lightning, waves, pirates), kept apart so they never shift ship spawns. */
  hazardRngState: number;
  /** Ids for ships, pirates and coast guard boats (one shared count). */
  nextShipId: number;
  /** How many spawn orders have been carried out. */
  spawnIndex: number;
  pirateSpawnIndex: number;
  /** The island's lamp. */
  beam: BeamState;
  /** The second lighthouse, if the level has one. */
  lamp2: LampState | null;
  /** Which lamp the player steers: 0 = the island's, 1 = the second. */
  activeLamp: number;
  abilities: AbilityState;
  /** Seconds left of a map-wide light (flare or lightning). */
  mapLight: number;
  ships: Ship[];
  rocks: Rock[];
  fogBands: FogBand[];
  whirlpools: WakePoint[];
  lightning: LightningState | null;
  waves: WavesState | null;
  pirates: Pirate[];
  tows: Tow[];
  saved: number;
  wrecked: number;
  caught: number;
  escaped: number;
  coins: number;
  preciousLost: boolean;
  objective: ObjectiveProgress;
  /** The endless watch's pace and what's still to come; null on a campaign night. */
  watch: WatchState | null;
  result: LevelResult | null;
  /** Events not yet collected by drainEvents(). */
  events: SimEvent[];
}

/** Everything fixed for the night, worked out once from the inputs. */
export interface WorldSetup {
  level: LevelDef;
  difficultyId: DifficultyId;
  difficulty: DifficultyConfig;
  upgrades: Upgrades;
  beam: BeamStats;
  reefs: readonly Reef[];
  buoys: readonly BuoyLight[];
  harbors: readonly HarborDef[];
  spawns: readonly SpawnOrder[];
  pirateSpawns: readonly PirateOrder[];
  ships: ShipRules;
  pirates: PirateRules;
  objective: BonusObjective;
  /** True when the night doesn't end with its last ship (sandbox, backdrop, endless watch). */
  endless: boolean;
  watch: WatchDef | null;
}

/** The hazard stream's seed: derived from the night's seed but independent of the ship stream. */
const hazardSeed = (seed: number): number => (seed ^ 0x5bd1e995) >>> 0;

/** A tutorial night lends its new ability: the night uses the better of the loan and what's owned. */
function withLoan(upgrades: Upgrades, level: LevelDef): Upgrades {
  const loan = level.loan;
  if (!loan) return upgrades;
  return {
    ...upgrades,
    foghorn: Math.max(upgrades.foghorn, loan.foghorn ?? 0),
    flares: Math.max(upgrades.flares, loan.flares ?? 0),
  };
}

export function createSetup(
  level: LevelDef,
  difficultyId: DifficultyId,
  owned: Upgrades,
  seed: number,
  options: WorldOptions = {},
): { setup: WorldSetup; rngState: number } {
  const difficulty = DIFFICULTIES[difficultyId];
  const upgrades = withLoan(owned, level);
  const rng = createRng(seed);
  const spawns = planSpawns(level, difficulty, SEA, rng);
  const harbors = level.harbors ?? [{ x: 0, y: 0, radius: SEA.defaultHarborRadius }];
  const current = level.current.strength * difficulty.currentStrength;
  const beam = beamStats(BEAM, BEAM_UPGRADES, upgrades);
  const setup: WorldSetup = {
    level,
    difficultyId,
    difficulty,
    upgrades,
    beam,
    reefs: buildReefs(level),
    buoys: upgrades.buoys.flatMap((index) => {
      const reef = level.reefs[index];
      return reef ? [{ x: reef.x, y: reef.y, radius: SEA.buoyRadius }] : [];
    }),
    harbors,
    spawns,
    pirateSpawns: planPirates(level, difficulty),
    ships: {
      behavior: SHIP_BEHAVIOR,
      types: SHIP_TYPES,
      sea: SEA,
      harbors,
      currentX: Math.cos(level.current.angle) * current,
      currentY: Math.sin(level.current.angle) * current,
      islandRadius: ISLAND.radius,
      smuggler: SMUGGLER,
      tug: TUG,
      whirlpool: HAZARDS.whirlpool,
      icebergHeadOnCos: HAZARDS.iceberg.headOnCos,
      foghornSpeedFactor: ABILITIES.foghorn.speedFactor,
    },
    pirates: {
      pirate: HAZARDS.pirate,
      sea: SEA,
      behavior: SHIP_BEHAVIOR,
      types: SHIP_TYPES,
      huntLimit: beam.range,
    },
    objective: createObjective(level.bonus, level, difficulty, LOOP.stepHz),
    endless: (options.endless ?? false) || options.watch !== undefined,
    watch: options.watch ?? null,
  };
  return { setup, rngState: rng.state };
}

export function startState(setup: WorldSetup, seed: number, rngState: number): WorldState {
  const { level } = setup;
  const hazardRng = createRng(hazardSeed(seed));
  const hazards = level.hazards;
  const lightning = hazards.some((h) => h.kind === 'lightning')
    ? startLightning(hazardRng, HAZARDS.lightning)
    : null;
  const waves = hazards.some((h) => h.kind === 'stormWaves')
    ? startWaves(hazardRng, HAZARDS.stormWaves)
    : null;
  const start = level.beamStart ?? BEAM_FEEL.startAngle;
  return {
    seed,
    tick: 0,
    time: 0,
    status: 'playing',
    rngState,
    hazardRngState: hazardRng.state,
    nextShipId: 1,
    spawnIndex: 0,
    pirateSpawnIndex: 0,
    beam: { angle: start, target: start },
    lamp2: level.secondLamp
      ? { x: level.secondLamp.x, y: level.secondLamp.y, angle: start, target: start }
      : null,
    activeLamp: 0,
    abilities: startAbilities(setup.upgrades),
    mapLight: 0,
    ships: [],
    rocks: buildRocks(level, SEA),
    fogBands: hazards.flatMap((h) =>
      h.kind === 'fogBand'
        ? [{ x: h.x, y: h.y, angle: h.angle, length: h.length, width: h.width }]
        : [],
    ),
    whirlpools: hazards.flatMap((h) => (h.kind === 'whirlpool' ? [{ x: h.x, y: h.y }] : [])),
    lightning,
    waves,
    pirates: [],
    tows: [],
    saved: 0,
    wrecked: 0,
    caught: 0,
    escaped: 0,
    coins: 0,
    preciousLost: false,
    objective: setup.objective.start(),
    watch: setup.watch ? startWatch(setup.watch, seed, ENDLESS) : null,
    result: null,
    events: [],
  };
}
