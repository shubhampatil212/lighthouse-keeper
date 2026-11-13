/** Checks a level's data against the fairness and layout rules. Returns a list of problems (empty = fine). */
import { ABILITIES } from '../data/abilities';
import { BEAM } from '../data/beam';
import { DIFFICULTIES } from '../data/difficulties';
import { HAZARDS } from '../data/hazards';
import { ISLAND } from '../data/island';
import { SEA } from '../data/sea';
import { SHIP_BEHAVIOR } from '../data/shipBehavior';
import { SHIP_TYPES } from '../data/ships';
import type { LevelDef } from '../data/types';
import { distanceToBand, throughFog, type FogBand } from './fog';
import { buildRocks } from './reefs';

const round = (n: number): number => Math.round(n);

/** The bonus objective must be possible with the ships, hazards and abilities the level has. */
function checkBonus(level: LevelDef): string[] {
  const bonus = level.bonus;
  const count = (type: string): number => level.ships.filter((s) => s.type === type).length;
  switch (bonus.kind) {
    case 'saveAllOfType':
      return count(bonus.type) > 0
        ? []
        : [`The bonus asks to save every ${bonus.type}, but none are scheduled.`];
    case 'catchSmugglers': {
      const wanted = bonus.count === 'all' ? 1 : bonus.count;
      return count('smuggler') >= wanted && wanted > 0
        ? []
        : ['The bonus asks for more smugglers than the level sends.'];
    }
    case 'driveOffPirates':
      return level.hazards.some((h) => h.kind === 'pirate') && bonus.count > 0
        ? []
        : ['The bonus asks to drive off pirates, but none are scheduled.'];
    case 'savedTogether':
      return bonus.count <= level.ships.length && bonus.count > 1 && bonus.within > 0
        ? []
        : ['The "ships home together" bonus is impossible with this many ships.'];
    case 'noLongDark':
    case 'finishUnder':
      return bonus.seconds > 0 ? [] : ['The bonus needs a positive number of seconds.'];
    case 'noAbility':
    case 'none':
      return [];
  }
}

/** No current (on any difficulty) may hold a drifting ship out at sea for good. */
function checkCurrent(level: LevelDef): string[] {
  const problems: string[] = [];
  const types = [...new Set(level.ships.map((s) => s.type))];
  for (const [id, d] of Object.entries(DIFFICULTIES)) {
    for (const type of types) {
      const ship = SHIP_TYPES[type];
      const push = level.current.strength * d.currentStrength * ship.windFactor;
      const drift = ship.speed * d.shipSpeed * SHIP_BEHAVIOR.darkSpeedFactor;
      if (push > drift * SEA.currentMaxShare) {
        problems.push(
          `On ${id}, the current is too strong for a drifting ${type} to make headway.`,
        );
      }
    }
  }
  return problems;
}

/** Fairness: a rock may not hide behind fog, and keeps open water between itself and any band. */
function checkFog(
  fog: readonly FogBand[],
  lamps: readonly { x: number; y: number }[],
  rock: { x: number; y: number; r: number },
  where: string,
): string[] {
  if (fog.length === 0) return [];
  const problems: string[] = [];
  const clear = lamps.some((lamp) => !throughFog(fog, lamp.x, lamp.y, rock.x, rock.y));
  if (!clear) problems.push(`${where} sits behind fog.`);
  for (const band of fog) {
    if (distanceToBand(band, rock.x, rock.y) - rock.r < HAZARDS.fog.rockClearance) {
      problems.push(`${where} is too close to a fog band.`);
    }
  }
  return problems;
}

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
  problems.push(...checkBonus(level), ...checkCurrent(level));

  // Fairness: everything that can sink a ship must sit well inside a lamp's un-upgraded reach.
  const lamps = [{ x: 0, y: 0 }, ...(level.secondLamp ? [level.secondLamp] : [])];
  const fog: FogBand[] = level.hazards.flatMap((h) => (h.kind === 'fogBand' ? [h] : []));
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
    if (rock.kind === 'rock') problems.push(...checkFog(fog, lamps, rock, where));
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
