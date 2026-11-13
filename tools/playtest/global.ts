/** Clears old results before a play-test, and writes the report (or a console summary) after. */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { findOutliers, buildReport } from './report';
import { LEVEL_FILTER, OUT_DIR, REPORT_PATH, SEEDS } from './options';
import type { LevelReport } from './run';

export default function setup(): () => void {
  rmSync(OUT_DIR, { recursive: true, force: true });
  return () => {
    if (!existsSync(OUT_DIR)) return;
    const levels = readdirSync(OUT_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(`${OUT_DIR}/${f}`, 'utf8')) as LevelReport)
      .sort((a, b) => a.levelId.localeCompare(b.levelId, 'en', { numeric: true }));
    for (const level of levels) {
      const cells = level.cells
        .map(
          (c) =>
            `${c.difficulty[0]}:${c.bot.slice(0, 5)} ${c.avgStars.toFixed(2)}★ ${Math.round(c.winRate * 100)}%w ${c.avgWrecks.toFixed(1)}x ${Math.round(c.bonusRate * 100)}%b ${Math.round(c.avgSeconds)}s`,
        )
        .join(' | ');
      console.log(`${level.levelId.padEnd(4)} ${cells}`);
    }
    for (const note of findOutliers(levels)) console.log(`! ${note.replace(/\*\*/g, '')}`);
    if (LEVEL_FILTER === null) {
      const date = new Date().toISOString().slice(0, 10);
      writeFileSync(REPORT_PATH, `${buildReport({ date, seeds: SEEDS, levels })}\n`);
      console.log(`Wrote ${REPORT_PATH}`);
    }
  };
}
