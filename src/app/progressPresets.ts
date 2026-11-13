/**
 * Placeholder progress for play-testing the screens before the real campaign (phase 06) and saves
 * (phase 08) exist. Pick one with ?progress=fresh|mid|all; without it a new keeper starts (fresh).
 */
import { CAMPAIGN } from '../data';
import { ALL_LEVELS } from './campaign';
import { NEW_PROGRESS, type Progress, type StarRecord } from './progress';

export type ProgressPresetId = 'fresh' | 'mid' | 'all';

const starsFor = (ids: readonly string[], stars: (i: number) => number): Progress['stars'] =>
  Object.fromEntries(ids.map((id, i): [string, StarRecord] => [id, { keeper: stars(i) }]));

const regionIds = (regionIndex: number): string[] =>
  (CAMPAIGN[regionIndex]?.levels ?? []).map((l) => l.id);

/** Region 1 finished, region 2 half done, some coins and upgrades. */
const MID: Progress = {
  ...NEW_PROGRESS,
  started: true,
  coins: 185,
  stars: starsFor(
    [...regionIds(0), '2-1', '2-2', '2-3'],
    (i) => [3, 2, 3, 1, 2, 2, 3, 2, 1][i] ?? 1,
  ),
  upgrades: { lens: 1, lamp: 2, gears: 1, foghorn: 1, flares: 0 },
  buoys: { '2-4': [1] },
  shipsSaved: 96,
  endlessBest: 412,
  lastLevel: '2-3',
};

/** Everything finished with three stars, upgrades maxed, plenty of coins. */
const ALL: Progress = {
  ...NEW_PROGRESS,
  started: true,
  coins: 2000,
  stars: starsFor(
    ALL_LEVELS.map((l) => l.id),
    () => 3,
  ),
  upgrades: { lens: 5, lamp: 5, gears: 4, foghorn: 3, flares: 3 },
  shipsSaved: 412,
  endlessBest: 1530,
  lastLevel: '5-6',
};

export const PROGRESS_PRESETS: Readonly<Record<ProgressPresetId, Progress>> = {
  fresh: NEW_PROGRESS,
  mid: MID,
  all: ALL,
};

export function progressPreset(name: string | null): Progress {
  return name === 'mid' || name === 'all' ? PROGRESS_PRESETS[name] : NEW_PROGRESS;
}
