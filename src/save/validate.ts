/**
 * Checks a save (from this device or an imported file) before the game uses it. The rule: a field
 * that's missing gets its default (so older saves keep working); a field with the wrong kind of
 * value means the save isn't ours or is damaged, so the whole thing is refused.
 */
import { ALL_LEVELS } from '../app/campaign';
import { NEW_PROGRESS, type Progress, type StarRecord } from '../app/progress';
import { DEFAULT_SETTINGS, SHOP } from '../data';
import type { DifficultyId } from '../data/types';
import type { GameSettings, UpgradeId } from '../data/uiTypes';
import { migrate, type RawSave } from './migrations';
import { SAVE_VERSION, type SaveData } from './schema';

/** Thrown inside the readers; caught once at the top. */
class Invalid extends Error {}

type Obj = Readonly<Record<string, unknown>>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function obj(v: unknown): Obj {
  if (!isObj(v)) throw new Invalid();
  return v;
}

function bool(v: unknown, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  if (typeof v !== 'boolean') throw new Invalid();
  return v;
}

/** A whole number from `min` to `max`. */
function int(v: unknown, fallback: number, min: number, max: number): number {
  if (v === undefined) return fallback;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) throw new Invalid();
  return v;
}

function oneOf<T extends string>(v: unknown, fallback: T, options: readonly T[]): T {
  if (v === undefined) return fallback;
  if (typeof v !== 'string' || !(options as readonly string[]).includes(v)) throw new Invalid();
  return v as T;
}

const DIFFICULTY_IDS: readonly DifficultyId[] = ['calm', 'keeper', 'storm'];
const LEVEL_IDS = new Set(ALL_LEVELS.map((l) => l.id));
const BIG = 1_000_000_000;

function readSettings(v: unknown): GameSettings {
  const s = v === undefined ? {} : obj(v);
  const d = DEFAULT_SETTINGS;
  const volume = (key: 'master' | 'music' | 'effects' | 'ambience'): number =>
    int(s[key], d[key], 0, 100);
  return {
    master: volume('master'),
    music: volume('music'),
    effects: volume('effects'),
    ambience: volume('ambience'),
    muted: bool(s.muted, d.muted),
    quality: oneOf(s.quality, d.quality, ['auto', 'low', 'medium', 'high']),
    showFps: bool(s.showFps, d.showFps),
    screenShake: bool(s.screenShake, d.screenShake),
    difficulty: oneOf(s.difficulty, d.difficulty, DIFFICULTY_IDS),
    beamControl: oneOf(s.beamControl, d.beamControl, ['follow', 'drag']),
    leftHanded: bool(s.leftHanded, d.leftHanded),
    tutorialPrompts: bool(s.tutorialPrompts, d.tutorialPrompts),
    reducedMotion: bool(s.reducedMotion, d.reducedMotion),
    colorblind: bool(s.colorblind, d.colorblind),
    highContrastReefs: bool(s.highContrastReefs, d.highContrastReefs),
    largerText: bool(s.largerText, d.largerText),
    haptics: bool(s.haptics, d.haptics),
  };
}

function readStars(v: unknown): Progress['stars'] {
  if (v === undefined) return {};
  const out: Record<string, StarRecord> = {};
  for (const [levelId, record] of Object.entries(obj(v))) {
    const r = obj(record);
    const stars: StarRecord = {};
    for (const id of DIFFICULTY_IDS) {
      if (r[id] !== undefined) stars[id] = int(r[id], 0, 0, 3);
    }
    // Levels this version doesn't have (renamed or from a newer game) are dropped.
    if (LEVEL_IDS.has(levelId)) out[levelId] = stars;
  }
  return out;
}

function readUpgrades(v: unknown): Progress['upgrades'] {
  const u = v === undefined ? {} : obj(v);
  const out = { ...NEW_PROGRESS.upgrades };
  for (const def of SHOP.upgrades) {
    const id: UpgradeId = def.id;
    out[id] = int(u[id], 0, 0, def.max);
  }
  return out;
}

function readBuoys(v: unknown): Progress['buoys'] {
  if (v === undefined) return {};
  const out: Record<string, number[]> = {};
  for (const [levelId, list] of Object.entries(obj(v))) {
    if (!Array.isArray(list)) throw new Invalid();
    const reefs = list.map((reef: unknown) => int(reef, 0, 0, 999));
    if (LEVEL_IDS.has(levelId)) out[levelId] = [...new Set(reefs)];
  }
  return out;
}

function readDaily(v: unknown): Progress['dailyBest'] {
  if (v === undefined || v === null) return null;
  const d = obj(v);
  if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) throw new Invalid();
  return { date: d.date, score: int(d.score, 0, 0, BIG) };
}

function readProgress(v: unknown): Progress {
  const p = obj(v);
  const lastLevel = p.lastLevel;
  if (lastLevel !== undefined && lastLevel !== null && typeof lastLevel !== 'string') {
    throw new Invalid();
  }
  return {
    started: bool(p.started, NEW_PROGRESS.started),
    coins: int(p.coins, 0, 0, BIG),
    stars: readStars(p.stars),
    upgrades: readUpgrades(p.upgrades),
    buoys: readBuoys(p.buoys),
    shipsSaved: int(p.shipsSaved, 0, 0, BIG),
    endlessBest: int(p.endlessBest, 0, 0, BIG),
    dailyBest: readDaily(p.dailyBest),
    lastLevel: typeof lastLevel === 'string' && LEVEL_IDS.has(lastLevel) ? lastLevel : null,
  };
}

/** The save in `raw` (already parsed from JSON), brought up to date and checked; or null. */
export function readSave(raw: unknown): SaveData | null {
  if (!isObj(raw)) return null;
  const current: RawSave | null = migrate(raw);
  if (!current) return null;
  try {
    return {
      version: SAVE_VERSION,
      settings: readSettings(current.settings),
      followSystemMotion: bool(current.followSystemMotion, true),
      progress: readProgress(current.progress),
    };
  } catch (error) {
    if (error instanceof Invalid) return null;
    throw error;
  }
}

/** Parses save text (a file or localStorage); null if it isn't JSON or isn't a valid save. */
export function parseSave(text: string): SaveData | null {
  try {
    return readSave(JSON.parse(text) as unknown);
  } catch {
    return null;
  }
}
