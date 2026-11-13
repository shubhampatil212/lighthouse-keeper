/**
 * The World holds one night: the lamps, ships, reefs, hazards and score. It's created from
 * (level, difficulty, upgrades, seed) and advanced one fixed tick at a time with step(dt, intents).
 * All of its changing state is plain data (WorldState, in worldSetup.ts), so a night can be copied
 * and replayed.
 */
import { ABILITIES } from '../data/abilities';
import { BEAM_FEEL } from '../data/beam';
import { ENDLESS } from '../data/endless';
import { HAZARDS } from '../data/hazards';
import { SEA } from '../data/sea';
import type {
  DifficultyId,
  HazardDef,
  HazardKind,
  LevelDef,
  ShipTypeId,
  Upgrades,
} from '../data/types';
import { coolDown, fireFlare, soundFoghorn, stepLamps, type AbilityContext } from './abilities';
import { canReach, lightAt, type LightOrigin, type LightSources } from './beam';
import { stepTows } from './coastGuard';
import { stepWatch } from './endless';
import type { Emit, FailReason, LevelOutcome, SimEvent } from './events';
import type { Intents } from './intents';
import { spawnPirate, stepPirates } from './pirates';
import { driftIcebergs, updateReefMemory } from './reefs';
import { createRng } from './rng';
import { spawnShip } from './ships';
import { stepLightning, stepWaves } from './storms';
import { ringBuoys, towWithTugs } from './tugs';
import { addHazard, clearHazard } from './worldEdit';
import { endNight, lightSourcesOf, recordWreck, settleNight, stepAllShips } from './worldNight';
import {
  createSetup,
  startState,
  type WorldOptions,
  type WorldSetup,
  type WorldState,
} from './worldSetup';

export type { WorldOptions, WorldSetup, WorldState, WorldStatus } from './worldSetup';

export interface World {
  readonly setup: WorldSetup;
  /** Read it to draw; only step() (and the sandbox calls below) change it. */
  readonly state: WorldState;
  step(dt: number, intents: Intents): void;
  /** Returns and clears the events since the last call. */
  drainEvents(): SimEvent[];
  isLit(x: number, y: number): boolean;
  /** Sandbox (and later Endless watch): send a ship in now from `angle`, bound for harbor `harbor`. */
  launchShip(type: ShipTypeId, angle: number, harbor?: number): void;
  /** Sandbox: add a hazard now. A pirate arrives at once, whatever its `at`. */
  addHazard(def: HazardDef): void;
  /** Sandbox: take every hazard of one kind off the sea. */
  clearHazard(kind: HazardKind): void;
}

export function createWorld(
  level: LevelDef,
  difficultyId: DifficultyId,
  upgrades: Upgrades,
  seed: number,
  options: WorldOptions = {},
): World {
  const { setup, rngState } = createSetup(level, difficultyId, upgrades, seed, options);
  return runWorld(setup, startState(setup, seed, rngState));
}

/** Continues a night from a copy of its state (the same level, difficulty and upgrades it began with). */
export function restoreWorld(
  level: LevelDef,
  difficultyId: DifficultyId,
  upgrades: Upgrades,
  state: WorldState,
  options: WorldOptions = {},
): World {
  return runWorld(createSetup(level, difficultyId, upgrades, state.seed, options).setup, state);
}

function runWorld(setup: WorldSetup, state: WorldState): World {
  const lightSources = (): LightSources => lightSourcesOf(setup, state);
  const end = (outcome: LevelOutcome, reason: FailReason | null): void => {
    endNight(setup, state, emit, outcome, reason);
  };
  const stepShips = (light: (x: number, y: number) => LightOrigin | null, dt: number): void => {
    stepAllShips(setup, state, emit, light, dt);
  };

  const emit: Emit = (event) => {
    state.events.push(event);
    setup.objective.onEvent(state.objective, event);
  };

  /** Runs `use` with the hazard random stream and saves its new state. */
  const withHazardRng = <T>(use: (rng: ReturnType<typeof createRng>) => T): T => {
    const rng = createRng(state.hazardRngState);
    const result = use(rng);
    state.hazardRngState = rng.state;
    return result;
  };

  const launch = (type: ShipTypeId, angle: number, harbor: number): void => {
    const rng = createRng(state.rngState);
    const shipSeed = rng.int(0, 0xffffffff);
    state.rngState = rng.state;
    const ship = spawnShip(
      state.nextShipId++,
      type,
      angle,
      setup.difficulty.shipSpeed,
      shipSeed,
      setup.ships,
      harbor,
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
  };

  const launchPirate = (angle: number): void => {
    const dir = withHazardRng((rng) => (rng.float() < 0.5 ? -1 : 1));
    const pirate = spawnPirate(state.nextShipId++, angle, dir, SEA);
    state.pirates.push(pirate);
    emit({
      type: 'pirateArrived',
      tick: state.tick,
      pirateId: pirate.id,
      x: pirate.x,
      y: pirate.y,
    });
  };

  const spawnDue = (): void => {
    for (
      let o = setup.spawns[state.spawnIndex];
      o && state.time >= o.at;
      o = setup.spawns[state.spawnIndex]
    ) {
      launch(o.type, o.angle, o.harbor);
      state.spawnIndex++;
    }
    for (
      let p = setup.pirateSpawns[state.pirateSpawnIndex];
      p && state.time >= p.at;
      p = setup.pirateSpawns[state.pirateSpawnIndex]
    ) {
      launchPirate(p.angle);
      state.pirateSpawnIndex++;
    }
  };

  const abilityContext = (): AbilityContext => ({
    abilities: state.abilities,
    upgrades: setup.upgrades,
    config: ABILITIES,
    ships: state.ships,
    tick: state.tick,
    emit,
    lightMap: (seconds) => {
      state.mapLight = Math.max(state.mapLight, seconds);
    },
  });

  return {
    setup,
    state,
    step(dt, intents) {
      state.tick++;
      state.time += dt;
      const { tick } = state;
      state.activeLamp = stepLamps(
        state.beam,
        state.lamp2,
        state.activeLamp,
        intents,
        setup.beam,
        BEAM_FEEL,
        ABILITIES.secondLamp.sweepSpeed,
        dt,
        tick,
        emit,
      );
      state.mapLight = Math.max(0, state.mapLight - dt);
      const playing = state.status === 'playing';

      if (playing) {
        coolDown(state.abilities, dt);
        if (intents.foghorn) soundFoghorn(abilityContext());
        if (intents.flare) fireFlare(abilityContext());
        const { lightning, waves } = state;
        if (lightning) {
          const flash = withHazardRng((rng) =>
            stepLightning(lightning, rng, HAZARDS.lightning, dt, tick, emit),
          );
          state.mapLight = Math.max(state.mapLight, flash);
        }
        if (waves)
          withHazardRng((rng) => {
            stepWaves(waves, rng, HAZARDS.stormWaves, dt, tick, emit);
          });
      }

      const light = lightSources();
      const lightOf = (x: number, y: number): LightOrigin | null => lightAt(light, x, y);
      const lit = (x: number, y: number): boolean => lightOf(x, y) !== null;
      // The coast guard keeps towing after the night ends.
      state.tows = stepTows(
        state.tows,
        setup.ships.smuggler,
        SEA,
        setup.ships.behavior,
        lit,
        dt,
        tick,
        emit,
      );
      // Once the night has ended, only the lamps and the tows keep moving.
      if (!playing) return;

      driftIcebergs(
        state.rocks,
        setup.beam.range - SEA.reefRangeMargin,
        SEA.defaultHarborRadius,
        HAZARDS.iceberg,
        dt,
      );
      spawnDue();
      if (state.watch && setup.watch) {
        stepWatch(
          state.watch,
          setup.watch,
          {
            time: state.time,
            rocks: state.rocks,
            ships: state.ships,
            whirlpools: state.whirlpools,
            launch: (type, angle) => {
              launch(type, angle, 0);
            },
            addHazard: (def) => {
              addHazard(state, def, withHazardRng, launchPirate);
            },
          },
          ENDLESS,
          SEA,
          setup.difficulty,
        );
      }
      towWithTugs(state.ships, setup.ships.tug, tick, emit);
      stepShips(lightOf, dt);
      ringBuoys(state.ships, setup.buoys, tick, emit);
      const boarded = stepPirates(
        state.pirates,
        state.ships,
        state.rocks,
        lightOf,
        setup.pirates,
        dt,
        tick,
        emit,
      );
      if (boarded.length > 0) {
        const sunk = new Set(boarded);
        for (const ship of sunk) recordWreck(setup, state, emit, ship, 'pirate', null);
        state.ships = state.ships.filter((s) => !sunk.has(s));
      }
      updateReefMemory(state.rocks, lit, setup.difficulty.reefMemory, dt, tick, emit);
      setup.objective.observe(state.objective, {
        ships: state.ships,
        reachable: (x, y) => canReach(light, x, y),
        dt,
      });

      settleNight(setup, state, end);
    },
    drainEvents() {
      const events = state.events;
      state.events = [];
      return events;
    },
    isLit(x, y) {
      return lightAt(lightSources(), x, y) !== null;
    },
    launchShip(type, angle, harbor = 0) {
      launch(type, angle, Math.max(0, Math.min(setup.harbors.length - 1, harbor)));
    },
    addHazard(def) {
      addHazard(state, def, withHazardRng, launchPirate);
    },
    clearHazard(kind) {
      clearHazard(state, kind);
    },
  };
}
