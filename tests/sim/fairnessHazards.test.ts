/**
 * Fairness with each phase 04 hazard and special ship (docs/CONTENT.md §2–3), on test levels built
 * from 1-2's layout. Split over two files (with fairnessHazards2) so they run in parallel.
 */
import { HAZARD_CAUSES, HAZARD_LEVELS, HAZARD_SEEDS } from './hazardLevels';
import { describeFairness } from './fairnessCheck';

for (const level of HAZARD_LEVELS.slice(0, 4)) {
  describeFairness(level, HAZARD_SEEDS, HAZARD_CAUSES[level.id]);
}
