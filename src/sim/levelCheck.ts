/** Checks a level's data against the fairness and layout rules. Returns a list of problems (empty = fine). */
import { BEAM } from '../data/beam';
import { SEA } from '../data/sea';
import { SHIP_TYPES } from '../data/ships';
import type { LevelDef } from '../data/types';
import { buildRocks } from './reefs';

export function validateLevel(level: LevelDef): string[] {
  const problems: string[] = [];
  if (level.ships.length === 0) problems.push('The level has no ships.');
  level.ships.forEach((ship, i) => {
    if (!(ship.type in SHIP_TYPES)) problems.push(`Ship ${i} has an unknown type "${ship.type}".`);
    if (!(ship.at >= 0)) problems.push(`Ship ${i} spawns at a negative time.`);
  });
  if (level.bonus.kind === 'saveAllOfType') {
    const type = level.bonus.type;
    if (!level.ships.some((ship) => ship.type === type)) {
      problems.push(`The bonus asks to save every ${type}, but none are scheduled.`);
    }
  }
  const harbors = level.harbors ?? [{ x: 0, y: 0, radius: SEA.defaultHarborRadius }];
  for (const rock of buildRocks(level, SEA)) {
    const d = Math.hypot(rock.x, rock.y);
    const where = `A rock of reef ${rock.reef} at (${Math.round(rock.x)}, ${Math.round(rock.y)})`;
    // Fairness: every rock must sit well inside the un-upgraded beam's reach.
    if (d + rock.r > BEAM.range - SEA.reefRangeMargin) {
      problems.push(`${where} is too close to the edge of the beam's range.`);
    }
    if (d + rock.r >= SEA.spawnRadius) problems.push(`${where} reaches the spawn ring.`);
    for (const harbor of harbors) {
      if (Math.hypot(rock.x - harbor.x, rock.y - harbor.y) - rock.r <= harbor.radius) {
        problems.push(`${where} touches a harbor.`);
      }
    }
  }
  return problems;
}
