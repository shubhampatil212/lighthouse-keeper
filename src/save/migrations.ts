/**
 * Migrations: MIGRATIONS[n] turns a version-n save into version n + 1. A save is walked up one
 * version at a time until it reaches SAVE_VERSION. Version 1 is the first saved shape, so the list
 * is empty for now; the next change to SaveData adds `1: (old) => ({ ...old, version: 2, … })`.
 */
import { SAVE_VERSION } from './schema';

export type RawSave = Readonly<Record<string, unknown>>;
type Migration = (old: RawSave) => RawSave;

export const MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {};

/**
 * Brings a raw save up to the current version. Null if it has no usable version, comes from a
 * newer game than this one, or a step is missing.
 */
export function migrate(
  raw: RawSave,
  migrations = MIGRATIONS,
  target = SAVE_VERSION,
): RawSave | null {
  const start = raw.version;
  if (typeof start !== 'number' || !Number.isInteger(start) || start < 1) return null;
  if (start > target) return null;
  let save = raw;
  for (let version = start; version < target; version++) {
    const step = migrations[version];
    if (!step) return null;
    save = step(save);
    if (save.version !== version + 1) return null;
  }
  return save;
}
