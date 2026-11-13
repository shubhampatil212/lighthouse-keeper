/**
 * Starting an endless watch: what it may send (the ships and hazards the keeper has met in the
 * campaign), and the daily sea, whose seed comes from the date so everyone gets the same sea.
 */
import { ENDLESS } from '../data';
import type { HazardKind, LevelDef, ShipTypeId, WatchDef } from '../data/types';
import { endlessLevel } from '../sim/endless';
import { seedFromString } from '../sim/rng';
import { STRINGS } from '../ui/strings';
import { ALL_LEVELS, levelDef } from './campaign';
import { isCleared, type Progress } from './progress';

/** Level ids the play scene and results use for the two kinds of watch. */
export const ENDLESS_ID = 'endless';
export const DAILY_ID = 'daily';

export const isWatchId = (levelId: string): boolean =>
  levelId === ENDLESS_ID || levelId === DAILY_ID;

/** Everything the campaign has: the daily sea uses it all, so it's the same for every keeper. */
const EVERYTHING: WatchDef = {
  ships: ['fishing', 'cargo', 'sailboat', 'tugboat', 'smuggler'],
  hazards: ['fogBand', 'iceberg', 'lightning', 'stormWaves', 'whirlpool', 'pirate'],
};

/** The ship types and hazards from every campaign night the keeper has cleared. */
export function watchFor(p: Progress): WatchDef {
  const ships = new Set<ShipTypeId>(['fishing']);
  const hazards = new Set<HazardKind>();
  for (const { id } of ALL_LEVELS) {
    if (!isCleared(p, id)) continue;
    const level = levelDef(id);
    for (const ship of level.ships) ships.add(ship.type);
    for (const hazard of level.hazards) hazards.add(hazard.kind);
  }
  ships.delete('ferry');
  return { ships: [...ships], hazards: [...hazards] };
}

/** Today's date on the player's own calendar, as YYYY-MM-DD. */
export function dailyKey(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export interface WatchNight {
  level: LevelDef;
  watch: WatchDef;
  /** The daily sea's fixed seed, or null for a fresh sea every attempt. */
  seed: number | null;
  daily: string | null;
}

export function watchNight(p: Progress, daily: boolean, now: Date): WatchNight {
  if (!daily) {
    // A free watch: its sea (the current, and then everything else) comes from each attempt's seed.
    const seed = Math.floor(Math.random() * 0x100000000);
    return {
      level: endlessLevel(ENDLESS_ID, STRINGS.titleEndless, seed, ENDLESS),
      watch: watchFor(p),
      seed: null,
      daily: null,
    };
  }
  const key = dailyKey(now);
  const seed = seedFromString(`lighthouse-keeper-daily-${key}`);
  return {
    level: endlessLevel(DAILY_ID, STRINGS.endlessDaily(key), seed, ENDLESS),
    watch: EVERYTHING,
    seed,
    daily: key,
  };
}
