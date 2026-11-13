/**
 * The one save object (CLAUDE.md rule 7): the player's settings and progress (stars, coins,
 * upgrades, bell buoys, records). The logbook's pages and silhouettes come from progress, so
 * they need nothing of their own. Bump SAVE_VERSION and add a migration whenever the shape changes.
 */
import { NEW_PROGRESS, type Progress } from '../app/progress';
import { DEFAULT_SETTINGS } from '../data';
import type { GameSettings } from '../data/uiTypes';

export const SAVE_VERSION = 1;

/** localStorage keys: the save, and a copy of an unreadable save kept for rescue. */
export const SAVE_KEY = 'lighthouse-keeper.save';
export const BACKUP_KEY = 'lighthouse-keeper.save.unreadable';

export interface SaveData {
  version: typeof SAVE_VERSION;
  settings: GameSettings;
  /** True until the player changes "reduced motion" themselves: until then it follows the device. */
  followSystemMotion: boolean;
  progress: Progress;
}

export const NEW_SAVE: SaveData = {
  version: SAVE_VERSION,
  settings: DEFAULT_SETTINGS,
  followSystemMotion: true,
  progress: NEW_PROGRESS,
};
