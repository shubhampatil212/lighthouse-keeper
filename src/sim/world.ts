/**
 * The World holds one night: the beam, ships, reefs and score. It's created from
 * (level, difficulty, upgrades, seed) and advanced one fixed tick at a time with step(dt, intents).
 * All of its changing state is plain data (WorldState), so a night can be copied and replayed.
 */
import { BEAM, BEAM_FEEL, BEAM_UPGRADES } from '../data/beam';
import { DIFFICULTIES } from '../data/difficulties';
import { SEA } from '../data/sea';
import { SHIP_BEHAVIOR } from '../data/shipBehavior';
import { SHIP_TYPES } from '../data/ships';
import type { DifficultyConfig, DifficultyId, HarborDef, LevelDef, Upgrades } from '../data/types';
import {
  beamStats,
  isLit,
  stepBeam,
  type BeamState,
  type BeamStats,
  type BuoyLight,
  type LightSources,
} from './beam';
import type { Emit, FailReason, LevelOutcome, LevelResult, SimEvent } from './events';
import type { Intents } from './intents';
import { createObjective, type BonusObjective, type ObjectiveProgress } from './objectives';
import { buildReefs, buildRocks, updateReefMemory, type Reef, type Rock } from './reefs';
import { createRng } from './rng';
import { allShipsResolved, failReason, starsFor } from './rules';
import { spawnShip, stepShip, type Ship, type ShipRules } from './ships';
import { planSpawns, type SpawnOrder } from './spawner';

export type WorldStatus = 'playing' | 'won' | 'failed';

/** Everything that changes during a night. Plain data only. */
export interface WorldState {
  seed: number;
  tick: number;
  /** Seconds since the night began. */
  time: number;
  status: WorldStatus;
  rngState: number;
  nextShipId: number;
  /** How many spawn orders have been carried out. */
  spawnIndex: number;
  beam: BeamState;
  /** Seconds left of a map-wide light (flare or lightning; phase 04). */
  mapLight: number;
  ships: Ship[];
  rocks: Rock[];
  saved: number;
  wrecked: number;
  coins: number;
  preciousLost: boolean;
  objective: ObjectiveProgress;
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
  ships: ShipRules;
  objective: BonusObjective;
}

export interface World {
  readonly setup: WorldSetup;
  /** Read it to draw; only step() changes it. */
  readonly state: WorldState;
  step(dt: number, intents: Intents): void;
  /** Returns and clears the events since the last call. */
  drainEvents(): SimEvent[];
  isLit(x: number, y: number): boolean;
}

function createSetup(
  level: LevelDef,
  difficultyId: DifficultyId,
  upgrades: Upgrades,
  seed: number,
): { setup: WorldSetup; rngState: number } {
  const difficulty = DIFFICULTIES[difficultyId];
  const rng = createRng(seed);
  const spawns = planSpawns(level, difficulty, SEA, rng);
  const harbors = level.harbors ?? [{ x: 0, y: 0, radius: SEA.defaultHarborRadius }];
  const current = level.current.strength * difficulty.currentStrength;
  const setup: WorldSetup = {
    level,
    difficultyId,
    difficulty,
    upgrades,
    beam: beamStats(BEAM, BEAM_UPGRADES, upgrades),
    reefs: buildReefs(level),
    buoys: upgrades.buoys.flatMap((index) => {
      const reef = level.reefs[index];
      return reef ? [{ x: reef.x, y: reef.y, radius: SEA.buoyRadius }] : [];
    }),
    harbors,
    spawns,
    ships: {
      behavior: SHIP_BEHAVIOR,
      types: SHIP_TYPES,
      sea: SEA,
      harbors,
      currentX: Math.cos(level.current.angle) * current,
      currentY: Math.sin(level.current.angle) * current,
    },
    objective: createObjective(level.bonus, level),
  };
  return { setup, rngState: rng.state };
}

export function createWorld(
  level: LevelDef,
  difficultyId: DifficultyId,
  upgrades: Upgrades,
  seed: number,
): World {
  const { setup, rngState } = createSetup(level, difficultyId, upgrades, seed);
  const state: WorldState = {
    seed,
    tick: 0,
    time: 0,
    status: 'playing',
    rngState,
    nextShipId: 1,
    spawnIndex: 0,
    beam: { angle: BEAM_FEEL.startAngle, target: BEAM_FEEL.startAngle },
    mapLight: 0,
    ships: [],
    rocks: buildRocks(level, SEA),
    saved: 0,
    wrecked: 0,
    coins: 0,
    preciousLost: false,
    objective: setup.objective.start(),
    result: null,
    events: [],
  };
  return runWorld(setup, state);
}

/** Continues a night from a copy of its state (the same level, difficulty and upgrades it began with). */
export function restoreWorld(
  level: LevelDef,
  difficultyId: DifficultyId,
  upgrades: Upgrades,
  state: WorldState,
): World {
  return runWorld(createSetup(level, difficultyId, upgrades, state.seed).setup, state);
}

function runWorld(setup: WorldSetup, state: WorldState): World {
  const lightSources = (): LightSources => ({
    angle: state.beam.angle,
    stats: setup.beam,
    edgeTolerance: BEAM_FEEL.edgeTolerance,
    buoys: setup.buoys,
    mapLit: state.mapLight > 0,
  });

  const emit: Emit = (event) => {
    state.events.push(event);
    setup.objective.onEvent(state.objective, event);
  };

  const spawnDue = (): void => {
    let order = setup.spawns[state.spawnIndex];
    while (order && state.time >= order.at) {
      const rng = createRng(state.rngState);
      const shipSeed = rng.int(0, 0xffffffff);
      state.rngState = rng.state;
      const ship = spawnShip(
        state.nextShipId++,
        order.type,
        order.angle,
        setup.difficulty.shipSpeed,
        shipSeed,
        setup.ships,
      );
      state.ships.push(ship);
      emit({
        type: 'shipSpawned',
        tick: state.tick,
        shipId: ship.id,
        shipType: ship.type,
        x: ship.x,
        y: ship.y,
      });
      state.spawnIndex++;
      order = setup.spawns[state.spawnIndex];
    }
  };

  const end = (outcome: LevelOutcome, reason: FailReason | null): void => {
    const bonusMet = setup.objective.isMet(state.objective);
    const result: LevelResult = {
      outcome,
      failReason: reason,
      stars: starsFor(outcome, state.wrecked, bonusMet, setup.level.stars),
      saved: state.saved,
      wrecked: state.wrecked,
      total: setup.spawns.length,
      coins: state.coins,
      bonusMet,
      time: state.time,
    };
    state.status = outcome;
    state.result = result;
    emit({ type: 'levelEnded', tick: state.tick, result });
  };

  const stepShips = (lit: (x: number, y: number) => boolean, dt: number): void => {
    const sailing: Ship[] = [];
    for (const ship of state.ships) {
      const fate = stepShip(ship, state.rocks, lit, setup.ships, dt, state.tick, emit);
      const type = setup.ships.types[ship.type];
      if (fate.kind === 'saved') {
        const coins = Math.round(type.coins * setup.difficulty.coinReward);
        state.saved++;
        state.coins += coins;
        emit({
          type: 'shipSaved',
          tick: state.tick,
          shipId: ship.id,
          shipType: ship.type,
          coins,
          x: ship.x,
          y: ship.y,
        });
      } else if (fate.kind === 'wrecked') {
        state.wrecked++;
        if (type.precious) state.preciousLost = true;
        emit({
          type: 'shipWrecked',
          tick: state.tick,
          shipId: ship.id,
          shipType: ship.type,
          reefIndex: fate.rock.reef,
          x: ship.x,
          y: ship.y,
        });
      } else {
        sailing.push(ship);
      }
    }
    state.ships = sailing;
  };

  return {
    setup,
    state,
    step(dt, intents) {
      state.tick++;
      state.time += dt;
      stepBeam(state.beam, intents.aimAngle, setup.beam, BEAM_FEEL, dt);
      state.mapLight = Math.max(0, state.mapLight - dt);
      // Once the night has ended, only the beam keeps moving.
      if (state.status !== 'playing') return;

      const light = lightSources();
      const lit = (x: number, y: number): boolean => isLit(light, x, y);
      spawnDue();
      stepShips(lit, dt);
      updateReefMemory(
        state.rocks,
        setup.reefs.length,
        lit,
        setup.difficulty.reefMemory,
        dt,
        state.tick,
        emit,
      );

      const reason = failReason(state.wrecked, setup.difficulty.wreckAllowance, state.preciousLost);
      if (reason) end('failed', reason);
      else if (allShipsResolved(setup.spawns.length, state.saved, state.wrecked)) end('won', null);
    },
    drainEvents() {
      const events = state.events;
      state.events = [];
      return events;
    },
    isLit(x, y) {
      return isLit(lightSources(), x, y);
    },
  };
}
