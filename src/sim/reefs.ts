/**
 * Reefs: clusters of rocks placed by the level. Rocks are visible only while lit, then a fading
 * outline ("reef memory") stays for the difficulty's memory time.
 */
import type { LevelDef, RockDef, SeaConfig } from '../data/types';
import type { Emit } from './events';
import { createRng } from './rng';

export interface Rock {
  x: number;
  y: number;
  r: number;
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

/** Builds every rock in the level. Generated rocks come from the level's own seed, so they never change. */
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
      rocks.push({
        x: reef.x + def.dx,
        y: reef.y + def.dy,
        r: def.r,
        reef: index,
        memory: 0,
        lit: false,
      });
    }
  });
  return rocks;
}

export function buildReefs(level: LevelDef): Reef[] {
  return level.reefs.map((reef) => ({ x: reef.x, y: reef.y }));
}

/**
 * Updates which rocks are lit and their memory. A reef counts as "revealed" when one of its rocks
 * comes into the light after the whole reef had been forgotten (or never seen).
 */
export function updateReefMemory(
  rocks: Rock[],
  reefCount: number,
  lit: (x: number, y: number) => boolean,
  memorySeconds: number,
  dt: number,
  tick: number,
  emit: Emit,
): void {
  const remembered = new Array<boolean>(reefCount).fill(false);
  for (const rock of rocks) if (rock.memory > 0) remembered[rock.reef] = true;

  const revealed = new Set<number>();
  for (const rock of rocks) {
    rock.lit = lit(rock.x, rock.y);
    if (rock.lit) {
      if (!remembered[rock.reef]) revealed.add(rock.reef);
      rock.memory = 1;
    } else {
      rock.memory = memorySeconds > 0 ? Math.max(0, rock.memory - dt / memorySeconds) : 0;
    }
  }
  for (const reefIndex of revealed) emit({ type: 'reefRevealed', tick, reefIndex });
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
