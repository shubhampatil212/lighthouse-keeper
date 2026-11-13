/**
 * The single versioned save object, stored in localStorage behind try/catch, with migrations when
 * the version changes (CLAUDE.md rule 7).
 */
export { migrate, MIGRATIONS } from './migrations';
export { BACKUP_KEY, NEW_SAVE, SAVE_KEY, SAVE_VERSION, type SaveData } from './schema';
export { browserStorage, createSaveStorage, type LoadResult, type SaveStorage } from './storage';
export { downloadSave, pickFile, readSaveFile, saveFileName } from './transfer';
export { parseSave, readSave } from './validate';
