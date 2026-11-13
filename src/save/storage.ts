/**
 * Reads and writes the save in localStorage, always behind try/catch: private browsing, a full disk
 * or blocked storage must never crash the game. Writes are debounced, and `flush` writes at once
 * (when the page is closing).
 */
import { BACKUP_KEY, SAVE_KEY, type SaveData } from './schema';
import { parseSave } from './validate';

export type LoadResult =
  | { kind: 'fresh' }
  | { kind: 'loaded'; save: SaveData }
  /** The stored save couldn't be read; it was copied to BACKUP_KEY and a new one begins. */
  | { kind: 'unreadable' };

export interface SaveStorage {
  load(): LoadResult;
  /** Writes `save` after a short pause (the last one wins). */
  write(save: SaveData): void;
  /** Writes any pending save now. */
  flush(): void;
  /** False when the browser won't let us store anything (the game still plays). */
  readonly available: boolean;
}

/** The browser's localStorage, or null if touching it throws (some private modes do). */
export function browserStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    const probe = `${SAVE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function createSaveStorage(storage: Storage | null, debounceMs: number): SaveStorage {
  let pending: SaveData | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const writeNow = (save: SaveData): void => {
    if (!storage) return;
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {
      // Storage full or blocked: keep playing; the next change tries again.
    }
  };

  const flush = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (pending) writeNow(pending);
    pending = null;
  };

  return {
    available: storage !== null,
    load() {
      if (!storage) return { kind: 'fresh' };
      let text: string | null;
      try {
        text = storage.getItem(SAVE_KEY);
      } catch {
        return { kind: 'fresh' };
      }
      if (text === null) return { kind: 'fresh' };
      const save = parseSave(text);
      if (save) return { kind: 'loaded', save };
      try {
        storage.setItem(BACKUP_KEY, text);
      } catch {
        // No room for the backup either; the friendly message still shows.
      }
      return { kind: 'unreadable' };
    },
    write(save) {
      pending = save;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, debounceMs);
    },
    flush,
  };
}
