/**
 * Loads the save at boot and keeps it written: settings and progress go to localStorage a moment
 * after each change, and at once when the page is hidden or closed. Also the Data actions of
 * Settings (export, import, reset). With ?progress= (a test preset) nothing is written, so a preset
 * can never overwrite a real keeper's save.
 */
import { UI_FEEL } from '../data';
import type { QualityChoice } from '../data/types';
import type { GameSettings } from '../data/uiTypes';
import {
  browserStorage,
  createSaveStorage,
  downloadSave,
  NEW_SAVE,
  readSaveFile,
  SAVE_VERSION,
  type SaveData,
} from '../save';
import { STRINGS } from '../ui/strings';
import { NEW_PROGRESS, type Progress } from './progress';
import { progressPreset } from './progressPresets';
import { createStore, type Store } from './store';

export interface SaveActions {
  /** False when nothing is written: storage is blocked, or a ?progress= test preset is on. */
  readonly canSave: boolean;
  exportSave(): void;
  /** Reads and checks a chosen file: the save it holds, or null if it isn't a valid save. */
  checkImport(file: File): Promise<SaveData | null>;
  /** Replaces settings and progress with `save` and writes it at once. */
  applyImport(save: SaveData): void;
  resetProgress(): void;
}

export interface LoadedGame {
  settings: Store<GameSettings>;
  progress: Store<Progress>;
  data: SaveActions;
  /** A message for the player once the title is up (an unreadable save), or null. */
  notice: string | null;
  /** Writes any pending change now (before the crash screen shows). */
  flush(): void;
}

export interface AddressOverrides {
  quality: QualityChoice | null;
  colorblind: boolean;
}

export function loadGame(params: URLSearchParams, overrides: AddressOverrides): LoadedGame {
  const preset = params.get('progress');
  const storage = createSaveStorage(preset ? null : browserStorage(), UI_FEEL.saveDebounceMs);
  const loaded = storage.load();
  const save = loaded.kind === 'loaded' ? loaded.save : NEW_SAVE;
  const device = window.matchMedia('(prefers-reduced-motion: reduce)');
  let followSystemMotion = save.followSystemMotion;

  const settings = createStore<GameSettings>({
    ...save.settings,
    reducedMotion: followSystemMotion ? device.matches : save.settings.reducedMotion,
    quality: overrides.quality ?? save.settings.quality,
    colorblind: overrides.colorblind || save.settings.colorblind,
  });
  const progress = createStore<Progress>(preset ? progressPreset(preset) : save.progress);

  const current = (): SaveData => ({
    version: SAVE_VERSION,
    settings: settings.get(),
    followSystemMotion,
    progress: progress.get(),
  });
  const write = (): void => {
    storage.write(current());
  };

  // Reduced motion follows the device until the player changes it in Settings.
  let lastMotion = settings.get().reducedMotion;
  let fromDevice = false;
  settings.subscribe((s) => {
    if (s.reducedMotion !== lastMotion && !fromDevice) followSystemMotion = false;
    lastMotion = s.reducedMotion;
    write();
  });
  device.addEventListener('change', () => {
    if (!followSystemMotion) return;
    fromDevice = true;
    settings.update((s) => ({ ...s, reducedMotion: device.matches }));
    fromDevice = false;
  });
  progress.subscribe(write);

  // Closing the tab or switching apps mid-campaign must not lose the last result.
  window.addEventListener('pagehide', () => {
    storage.flush();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) storage.flush();
  });

  const data: SaveActions = {
    canSave: storage.available,
    exportSave() {
      storage.flush();
      downloadSave(current());
    },
    checkImport: readSaveFile,
    applyImport(next) {
      followSystemMotion = next.followSystemMotion;
      fromDevice = true;
      settings.set({
        ...next.settings,
        reducedMotion: followSystemMotion ? device.matches : next.settings.reducedMotion,
      });
      fromDevice = false;
      lastMotion = settings.get().reducedMotion;
      progress.set(next.progress);
      storage.write(current());
      storage.flush();
    },
    resetProgress() {
      progress.set(NEW_PROGRESS);
      storage.flush();
    },
  };

  return {
    settings,
    progress,
    data,
    notice: loaded.kind === 'unreadable' ? STRINGS.saveUnreadable : null,
    flush() {
      storage.flush();
    },
  };
}
