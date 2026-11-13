/** One region's play-test, run as a Vitest file so the five regions play in parallel. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { CAMPAIGN } from '../../src/data';
import { REGION_KITS } from './kits';
import { BOTS, DIFFICULTIES, OUT_DIR, SEEDS, wanted } from './options';
import { levelReport } from './run';

export function playRegion(index: number): void {
  const region = CAMPAIGN[index];
  const kit = REGION_KITS[index];
  if (!region || !kit) throw new Error(`No region ${index}`);
  const levels = region.levels.filter((l) => wanted(l.id));
  if (levels.length === 0) it.skip(`region ${index + 1} (filtered out)`, () => undefined);
  for (const level of levels) {
    it(`plays ${level.id}`, () => {
      const report = levelReport(level.id, DIFFICULTIES, BOTS, SEEDS, kit);
      mkdirSync(OUT_DIR, { recursive: true });
      writeFileSync(`${OUT_DIR}/${level.id}.json`, JSON.stringify(report));
    });
  }
}
