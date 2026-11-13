/** Fairness of every campaign level (see fairnessCheck.ts for what is checked). */
import { LEVELS } from '../../src/data';
import { describeFairness } from './fairnessCheck';

const SEEDS = 120;

for (const level of Object.values(LEVELS)) describeFairness(level, SEEDS);
