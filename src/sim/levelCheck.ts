/** Checks a level's data against the fairness and layout rules. Returns a list of problems (empty = fine). */
import { ABILITIES } from '../data/abilities';
import { BEAM } from '../data/beam';
import { HAZARDS } from '../data/hazards';
import { ISLAND } from '../data/island';
import { SEA } from '../data/sea';
import { SHIP_TYPES } from '../data/ships';
import type { LevelDef } from '../data/types';
import { buildRocks } from './reefs';

const round = (n: number): number => Math.round(n);

export function validateLevel(level: LevelDef): string[] {
  const problems: string[] = [];
  const harbors = level.harbors ?? [{ x: 0, y: 0, radius: SEA.defaultHarborRadius }];
  if (level.ships.length === 0) problems.push('The level has no ships.');
  level.ships.forEach((ship, i) => {
    if (!(ship.type in SHIP_TYPES)) problems.push(`Ship ${i} has an unknown type "${ship.type}".`);
    if (!(ship.at >= 0)) problems.push(`Ship ${i} spawns at a negative time.`);
    const harbor = ship.harbor ?? 0;
    if (!Number.isInteger(harbor) || harbor < 0 || harbor >= harbors.length) {
      problems.push(`Ship ${i} is bound for harbor ${harbor}, which doesn't exist.`);
    }
  });
  if (level.bonus.kind === 'saveAllOfType') {
    const type = level.bonus.type;
    if (!level.ships.some((ship) => ship.type === type)) {
      problems.push(`The bonus asks to save every ${type}, but none are scheduled.`);
    }
  }

  // Fairness: everything that can sink a ship must sit well inside a lamp's un-upgraded reach.
  const lamps = [{ x: 0, y: 0 }, ...(level.secondLamp ? [level.secondLamp] : [])];
  const waves = level.hazards.some((h) => h.kind === 'stormWaves');
  const limit = BEAM.range - SEA.reefRangeMargin - (waves ? HAZARDS.stormWaves.extraReefMargin : 0);
  const inReach = (x: number, y: number, r: number): boolean =>
    lamps.some((lamp) => Math.hypot(x - lamp.x, y - lamp.y) + r <= limit);

  harbors.forEach((harbor, i) => {
    if (!inReach(harbor.x, harbor.y, harbor.radius)) {
      problems.push(`Harbor ${i} is too far out for the beam to guide ships into it.`);
    }
  });

  for (const rock of buildRocks(level, SEA)) {
    const d = Math.hypot(rock.x, rock.y);
    const what = rock.kind === 'rock' ? `A rock of reef ${rock.reef}` : `The ${rock.kind}`;
    const where = `${what} at (${round(rock.x)}, ${round(rock.y)})`;
    // The islet sits in its own lamp's glow, so it's always lit.
    if (rock.kind !== 'islet' && !inReach(rock.x, rock.y, rock.r)) {
      problems.push(`${where} is too close to the edge of the beam's range.`);
    }
    if (d + rock.r >= SEA.spawnRadius) problems.push(`${where} reaches the spawn ring.`);
    if (rock.kind === 'iceberg') {
      // Icebergs bounce inside the zone between the harbor and the reef limit.
      if (d - rock.r < SEA.defaultHarborRadius + HAZARDS.iceberg.harborGap) {
        problems.push(`${where} starts too close to the harbor.`);
      }
      continue;
    }
    for (const harbor of harbors) {
      if (Math.hypot(rock.x - harbor.x, rock.y - harbor.y) - rock.r <= harbor.radius) {
        problems.push(`${where} touches a harbor.`);
      }
    }
  }

  const { pullRadius, coreRadius } = HAZARDS.whirlpool;
  for (const h of level.hazards) {
    if (h.kind !== 'whirlpool') continue;
    const where = `The whirlpool at (${round(h.x)}, ${round(h.y)})`;
    if (!inReach(h.x, h.y, coreRadius)) problems.push(`${where} is too far out for the beam.`);
    for (const harbor of harbors) {
      if (Math.hypot(h.x - harbor.x, h.y - harbor.y) - pullRadius <= harbor.radius) {
        problems.push(`${where} pulls at a harbor.`);
      }
    }
  }

  if (level.secondLamp) {
    const { x, y } = level.secondLamp;
    const clear = ISLAND.radius + ABILITIES.secondLamp.isletRadius + SEA.defaultHarborRadius;
    if (Math.hypot(x, y) < clear)
      problems.push('The second lighthouse is too close to the island.');
  }
  return problems;
}
