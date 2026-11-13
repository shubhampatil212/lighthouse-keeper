/**
 * Reefs: clusters of rocks placed by the level, plus drifting icebergs (each its own one-rock reef)
 * and the islet under a second lighthouse. Rocks are visible only while lit, then a fading outline
 * ("reef memory") stays for the difficulty's memory time.
 */
import { ABILITIES } from '../data/abilities';
import { HAZARDS } from '../data/hazards';
import type { HazardDef, IcebergConfig, LevelDef, RockDef, SeaConfig } from '../data/types';
import type { Emit } from './events';
import { createRng, type Rng } from './rng';

/** A plain rock, a drifting iceberg, or the islet a second lighthouse stands on. */
export type RockKind = 'rock' | 'iceberg' | 'islet';

export interface Rock {
  kind: RockKind;
  x: number;
  y: number;
  r: number;
  /** Drift velocity (icebergs only; 0 otherwise). */
  vx: number;
  vy: number;
  /** Index of the reef this rock belongs to. */
  reef: number;
  /** 1 while lit, fading to 0 after the light leaves. */
  memory: number;
  lit: boolean;
}

export interface Reef {
  x: number;
  y: number;
}

type IcebergDef = Extract<HazardDef, { kind: 'iceberg' }>;

export const makeRock = (
  kind: RockKind,
  x: number,
  y: number,
  r: number,
  reef: number,
  vx = 0,
  vy = 0,
): Rock => ({ kind, x, y, r, vx, vy, reef, memory: 0, lit: false });

/** An iceberg; size, heading and speed come from the definition, or else from `rng`. */
export function makeIceberg(def: IcebergDef, reef: number, rng: Rng, config: IcebergConfig): Rock {
  const r = def.radius ?? rng.range(config.radiusMin, config.radiusMax);
  const heading = def.heading ?? rng.range(-Math.PI, Math.PI);
  const speed = def.speed ?? rng.range(config.speedMin, config.speedMax);
  return makeRock(
    'iceberg',
    def.x,
    def.y,
    r,
    reef,
    Math.cos(heading) * speed,
    Math.sin(heading) * speed,
  );
}

/**
 * Builds every rock in the level: reefs, then icebergs, then the second lighthouse's islet.
 * Generated sizes come from the level's own seed, so they never change between attempts.
 */
export function buildRocks(level: LevelDef, sea: SeaConfig): Rock[] {
  const rng = createRng(level.seed);
  const rocks: Rock[] = [];
  level.reefs.forEach((reef, index) => {
    const defs: readonly RockDef[] =
      reef.rocks ??
      Array.from({ length: rng.int(sea.rocksPerReefMin, sea.rocksPerReefMax) }, () => ({
        r: rng.range(sea.rockRadiusMin, sea.rockRadiusMax),
        dx: rng.range(-sea.rockSpread, sea.rockSpread),
        dy: rng.range(-sea.rockSpread, sea.rockSpread),
      }));
    for (const def of defs) {
      rocks.push(makeRock('rock', reef.x + def.dx, reef.y + def.dy, def.r, index));
    }
  });
  let reef = level.reefs.length;
  for (const hazard of level.hazards) {
    if (hazard.kind === 'iceberg') rocks.push(makeIceberg(hazard, reef++, rng, HAZARDS.iceberg));
  }
  if (level.secondLamp) {
    const { x, y } = level.secondLamp;
    rocks.push(makeRock('islet', x, y, ABILITIES.secondLamp.isletRadius, reef));
  }
  return rocks;
}

export function buildReefs(level: LevelDef): Reef[] {
  return level.reefs.map((reef) => ({ x: reef.x, y: reef.y }));
}

/** The next free reef index (for a rock added during the night, such as a sandbox iceberg). */
export function nextReefIndex(rocks: readonly Rock[]): number {
  return rocks.reduce((max, rock) => Math.max(max, rock.reef + 1), 0);
}

/** Reflects a drifting rock's velocity off a surface whose outward normal is (nx, ny), if it's heading in. */
function bounce(rock: Rock, nx: number, ny: number): void {
  const into = rock.vx * nx + rock.vy * ny;
  if (into >= 0) return;
  rock.vx -= 2 * into * nx;
  rock.vy -= 2 * into * ny;
}

/**
 * Moves icebergs. They bounce off two circles so they always stay in the fair zone: the outer edge
 * within `outerLimit` of the island (where the beam can reach them in time), the inner edge clear
 * of the harbor by the configured gap. They also bounce off rocks and each other, so a channel
 * beside a reef never closes.
 */
export function driftIcebergs(
  rocks: readonly Rock[],
  outerLimit: number,
  harborRadius: number,
  config: IcebergConfig,
  dt: number,
): void {
  for (const rock of rocks) {
    if (rock.kind !== 'iceberg') continue;
    rock.x += rock.vx * dt;
    rock.y += rock.vy * dt;
    const d = Math.hypot(rock.x, rock.y);
    if (d < 0.001) continue;
    const nx = rock.x / d;
    const ny = rock.y / d;
    if (d + rock.r > outerLimit) bounce(rock, -nx, -ny);
    if (d - rock.r < harborRadius + config.harborGap) bounce(rock, nx, ny);
    for (const other of rocks) {
      if (other === rock) continue;
      const ox = rock.x - other.x;
      const oy = rock.y - other.y;
      const od = Math.hypot(ox, oy);
      if (od < 0.001 || od - rock.r - other.r >= config.laneGap) continue;
      bounce(rock, ox / od, oy / od);
    }
  }
}

/**
 * Updates which rocks are lit and their memory. A reef counts as "revealed" when one of its rocks
 * comes into the light after the whole reef had been forgotten (or never seen).
 */
export function updateReefMemory(
  rocks: Rock[],
  lit: (x: number, y: number) => boolean,
  memorySeconds: number,
  dt: number,
  tick: number,
  emit: Emit,
): void {
  const remembered = new Set<number>();
  for (const rock of rocks) if (rock.memory > 0) remembered.add(rock.reef);

  const revealed = new Map<number, Rock>();
  for (const rock of rocks) {
    rock.lit = lit(rock.x, rock.y);
    if (rock.lit) {
      if (!remembered.has(rock.reef) && !revealed.has(rock.reef)) revealed.set(rock.reef, rock);
      rock.memory = 1;
    } else {
      rock.memory = memorySeconds > 0 ? Math.max(0, rock.memory - dt / memorySeconds) : 0;
    }
  }
  for (const [reefIndex, rock] of revealed) {
    emit({ type: 'reefRevealed', tick, reefIndex, kind: rock.kind, x: rock.x, y: rock.y });
  }
}

/** The first rock a hull of the given radius touches at (x, y), or null. */
export function rockAt(
  rocks: readonly Rock[],
  x: number,
  y: number,
  hullRadius: number,
): Rock | null {
  for (const rock of rocks) {
    if (Math.hypot(x - rock.x, y - rock.y) < rock.r + hullRadius) return rock;
  }
  return null;
}
