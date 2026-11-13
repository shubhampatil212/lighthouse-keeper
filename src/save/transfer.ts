/** Export the save as a downloaded JSON file, and read one back in (checked before it's used). */
import type { SaveData } from './schema';
import { parseSave } from './validate';

/** "lighthouse-keeper-save-2026-11-13.json" */
export function saveFileName(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `lighthouse-keeper-save-${day}.json`;
}

export function downloadSave(save: SaveData, now = new Date()): void {
  const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = saveFileName(now);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/** Largest file we'll try to read: a real save is a few kilobytes. */
const MAX_BYTES = 512 * 1024;

/** Reads a chosen file; null if it's too big, unreadable, or not a valid save. */
export async function readSaveFile(file: File): Promise<SaveData | null> {
  if (file.size > MAX_BYTES) return null;
  try {
    return parseSave(await file.text());
  } catch {
    return null;
  }
}

/** Opens the system file picker for a .json file. */
export function pickFile(onPick: (file: File) => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) onPick(file);
  });
  input.click();
}
