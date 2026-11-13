/**
 * Endless watch (docs/CONTENT.md §7): ships keep coming faster, a new reef cluster every 30 s and a
 * new hazard type every 2 minutes, from what the keeper has met. Everything comes from the night's
 * seed, so a daily seed gives everyone the same sea. The run ends when wrecks pass the allowance.
 */
import { HAZARDS } from '../data/hazards';
import type {
  DifficultyConfig,
  EndlessConfig,
  HazardDef,
  HazardKind,
  LevelDef,
  SeaConfig,
  ShipTypeId,
  WatchDef,
} from '../data/types';
import { makeRock, nextReefIndex, type Rock } from './reefs';
import { createRng, type Rng } from './rng';
import type { Ship, WakePoint } from './ships';

/** The watch's own plain-data state, kept in the world state. */
export interface WatchState {
  rngState: number;
  started: boolean;
  /** Seconds since the night began when the next ship, ramp and hazard are due. */
  nextShipAt: number;
  nextRampAt: number;
  nextHazardAt: number;
  /** Seconds between ships now (before the difficulty's multiplier). */
  interval: number;
  /** The hazard types still to join, in the order they will. */
  hazardsToCome: HazardKind[];
  reefsAdded: number;
}

/** What the watch may change on the sea. */
export interface WatchSea {
  time: number;
  rocks: Rock[];
  ships: readonly Ship[];
  whirlpools: readonly WakePoint[];
  launch(type: ShipTypeId, angle: number): void;
  addHazard(def: HazardDef): void;
}

/** The empty sea an endless watch starts from: the current's direction comes from the seed. */
export function endlessLevel(
  id: string,
  name: string,
  seed: number,
  config: EndlessConfig,
): LevelDef {
  const rng = createRng(seed ^ 0x2545f491);
  return {
    id,
    name,
    region: 'harborBay',
    seed,
    ships: [],
    reefs: [],
    hazards: [],
    current: { angle: rng.range(-Math.PI, Math.PI), strength: config.currentStrength },
    bonus: { kind: 'none' },
    stars: { twoStarMaxWrecks: 0, threeStarMaxWrecks: 0 },
  };
}

export function startWatch(def: WatchDef, seed: number, config: EndlessConfig): WatchState {
  const rng = createRng(seed ^ 0x68e31da4);
  // A seeded shuffle of the hazards, so each sea brings them in its own order.
  const hazards = [...new Set(def.hazards)];
  for (let i = hazards.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const a = hazards[i];
    const b = hazards[j];
    if (a !== undefined && b !== undefined) {
      hazards[i] = b;
      hazards[j] = a;
    }
  }
  return {
    rngState: rng.state,
    started: false,
    nextShipAt: 1,
    nextRampAt: config.rampEvery,
    nextHazardAt: config.hazardEvery,
    interval: config.startInterval,
    hazardsToCome: hazards,
    reefsAdded: 0,
  };
}

/** Score = ships saved × 10 + whole seconds survived. */
export function watchScore(saved: number, seconds: number, config: EndlessConfig): number {
  return saved * config.scorePerShip + Math.floor(seconds);
}

function pickShip(rng: Rng, def: WatchDef, config: EndlessConfig): ShipTypeId {
  const pool = def.ships.filter((t) => t !== 'ferry');
  const weights = pool.map((t) => config.shipWeights[t] ?? 1);
  let roll = rng.float() * weights.reduce((a, b) => a + b, 0);
  for (const [i, type] of pool.entries()) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return type;
  }
  return pool[0] ?? 'fishing';
}

/** Adds a reef cluster somewhere fair: clear of other rocks, ships and whirlpools. */
function placeReef(rng: Rng, sea: WatchSea, config: EndlessConfig, rules: SeaConfig): boolean {
  for (let attempt = 0; attempt < 20; attempt++) {
    const d = rng.range(config.reefDistanceMin, config.reefDistanceMax);
    const a = rng.range(-Math.PI, Math.PI);
    const cx = Math.cos(a) * d;
    const cy = Math.sin(a) * d;
    const count = rng.int(rules.rocksPerReefMin, rules.rocksPerReefMax);
    const rocks = Array.from({ length: count }, () => ({
      x: cx + rng.range(-rules.rockSpread, rules.rockSpread),
      y: cy + rng.range(-rules.rockSpread, rules.rockSpread),
      r: rng.range(rules.rockRadiusMin, rules.rockRadiusMax),
    }));
    const clear = rocks.every(
      (rock) =>
        sea.rocks.every(
          (o) => Math.hypot(o.x - rock.x, o.y - rock.y) > o.r + rock.r + config.reefClearance,
        ) &&
        sea.ships.every((s) => Math.hypot(s.x - rock.x, s.y - rock.y) > config.shipClearance) &&
        sea.whirlpools.every(
          (w) => Math.hypot(w.x - rock.x, w.y - rock.y) > HAZARDS.whirlpool.pullRadius,
        ),
    );
    if (!clear) continue;
    const reef = nextReefIndex(sea.rocks);
    for (const rock of rocks) sea.rocks.push(makeRock('rock', rock.x, rock.y, rock.r, reef));
    return true;
  }
  return false;
}

/** A spot on the circle at `distance` with no rock within `room` of it, or null. */
function openSpot(
  rng: Rng,
  sea: WatchSea,
  distance: number,
  room: number,
): { x: number; y: number; a: number } | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = rng.range(-Math.PI, Math.PI);
    const x = Math.cos(a) * distance;
    const y = Math.sin(a) * distance;
    if (sea.rocks.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + room)) return { x, y, a };
  }
  return null;
}

function hazardFor(
  kind: HazardKind,
  rng: Rng,
  sea: WatchSea,
  config: EndlessConfig,
): HazardDef | null {
  switch (kind) {
    case 'lightning':
    case 'stormWaves':
      return { kind };
    case 'pirate':
      return { kind, at: 0, angle: rng.range(-Math.PI, Math.PI) };
    case 'fogBand': {
      const a = rng.range(-Math.PI, Math.PI);
      const d = config.fogDistance;
      return {
        kind,
        x: Math.cos(a) * d,
        y: Math.sin(a) * d,
        angle: a + Math.PI / 2,
        length: config.fogLength,
        width: config.fogWidth,
      };
    }
    case 'iceberg': {
      const spot = openSpot(rng, sea, config.icebergDistance, HAZARDS.iceberg.radiusMax + 20);
      return spot ? { kind, x: spot.x, y: spot.y } : null;
    }
    case 'whirlpool': {
      const spot = openSpot(rng, sea, config.whirlpoolDistance, HAZARDS.whirlpool.coreRadius + 30);
      return spot ? { kind, x: spot.x, y: spot.y } : null;
    }
  }
}

/** One tick of the watch: send ships, raise the pace, add reefs and hazards when due. */
export function stepWatch(
  watch: WatchState,
  def: WatchDef,
  sea: WatchSea,
  config: EndlessConfig,
  rules: SeaConfig,
  difficulty: DifficultyConfig,
): void {
  const rng = createRng(watch.rngState);
  if (!watch.started) {
    watch.started = true;
    for (let i = 0; i < config.startReefs; i++) placeReef(rng, sea, config, rules);
  }
  if (sea.time >= watch.nextShipAt) {
    sea.launch(pickShip(rng, def, config), rng.range(-Math.PI, Math.PI));
    watch.nextShipAt += watch.interval * difficulty.spawnInterval;
  }
  if (sea.time >= watch.nextRampAt) {
    watch.nextRampAt += config.rampEvery;
    watch.interval = Math.max(config.minInterval, watch.interval * config.rampFactor);
    if (
      watch.reefsAdded + config.startReefs < config.maxReefs &&
      placeReef(rng, sea, config, rules)
    ) {
      watch.reefsAdded++;
    }
  }
  if (sea.time >= watch.nextHazardAt) {
    watch.nextHazardAt += config.hazardEvery;
    const kind = watch.hazardsToCome.shift();
    const hazard = kind ? hazardFor(kind, rng, sea, config) : null;
    if (hazard) sea.addHazard(hazard);
  }
  watch.rngState = rng.state;
}
