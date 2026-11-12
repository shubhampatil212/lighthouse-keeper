/** Turns a level's ship schedule into spawn orders: when each ship appears and from which angle. */
import type { Compass, DifficultyConfig, LevelDef, SeaConfig, ShipTypeId } from '../data/types';
import type { Rng } from './rng';

export interface SpawnOrder {
  /** Seconds since the night began. */
  at: number;
  type: ShipTypeId;
  /** Direction from the island to the spawn point (radians). */
  angle: number;
}

/** Screen y grows downward, so north (up) is -PI/2. */
const COMPASS: Record<Compass, number> = {
  north: -Math.PI / 2,
  east: 0,
  south: Math.PI / 2,
  west: Math.PI,
};

export function planSpawns(
  level: LevelDef,
  difficulty: DifficultyConfig,
  sea: SeaConfig,
  rng: Rng,
): SpawnOrder[] {
  return level.ships
    .map((ship) => ({
      at: ship.at * difficulty.spawnInterval,
      type: ship.type,
      angle:
        'edge' in ship
          ? COMPASS[ship.edge] + rng.range(-sea.edgeSpawnSpread, sea.edgeSpawnSpread)
          : ship.angle,
    }))
    .sort((a, b) => a.at - b.at);
}
