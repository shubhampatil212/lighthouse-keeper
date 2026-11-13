/** Fairness with the rest of the phase 04 hazards (see fairnessHazards.test.ts). */
import { HAZARD_CAUSES, HAZARD_LEVELS, HAZARD_SEEDS } from './hazardLevels';
import { describeFairness } from './fairnessCheck';

for (const level of HAZARD_LEVELS.slice(4)) {
  describeFairness(level, HAZARD_SEEDS, HAZARD_CAUSES[level.id]);
}
