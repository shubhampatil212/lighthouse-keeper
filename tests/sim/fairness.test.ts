/** Fairness of every campaign level (see fairnessCheck.ts for what is checked). */
import { LEVELS } from '../../src/data';
import { describeFairness } from './fairnessCheck';

/**
 * 1-2 (the level the check was built on) replays 120 seeds; the other 29 replay fewer so the suite
 * stays a few minutes long. FAIRNESS_SEEDS=120 runs every level in full.
 */
const FULL = 120;
const EACH = Number(process.env.FAIRNESS_SEEDS ?? 8);

for (const level of Object.values(LEVELS)) {
  describeFairness(level, level.id === '1-2' ? FULL : EACH);
}
