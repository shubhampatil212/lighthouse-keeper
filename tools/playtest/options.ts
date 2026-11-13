/**
 * Play-tester options, from environment variables:
 *   PLAYTEST_SEEDS=40          nights per level, difficulty and bot
 *   PLAYTEST_LEVELS=1-,2-3     level ids or prefixes (left out = all 30; then the report is written)
 *   PLAYTEST_DIFF=keeper       difficulties (comma separated)
 *   PLAYTEST_BOTS=smart        bots (comma separated)
 */
import type { DifficultyId } from '../../src/data/types';
import { BOT_IDS, type BotId } from './bots';

const list = (name: string): string[] | null => {
  const raw = process.env[name];
  return raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
};

export const OUT_DIR = 'node_modules/.cache/playtest';
export const REPORT_PATH = 'docs/balance-report.md';

export const SEEDS = Number(process.env.PLAYTEST_SEEDS ?? 40);
export const LEVEL_FILTER = list('PLAYTEST_LEVELS');
export const DIFFICULTIES = (list('PLAYTEST_DIFF') ?? [
  'calm',
  'keeper',
  'storm',
]) as DifficultyId[];
export const BOTS = (list('PLAYTEST_BOTS') ?? [...BOT_IDS]) as BotId[];

export const wanted = (levelId: string): boolean =>
  LEVEL_FILTER === null || LEVEL_FILTER.some((f) => levelId === f || levelId.startsWith(f));
