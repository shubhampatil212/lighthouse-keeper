import type { IslandBuildingId, IslandShape } from './types';

/** The island's size in world units (matches the prototype). */
export const ISLAND: IslandShape = {
  radius: 34,
};

/** Buildings in the order the campaign adds them, one per finished region (docs/GDD.md §4). */
export const ISLAND_BUILDINGS: readonly IslandBuildingId[] = [
  'cottage',
  'dock',
  'chapel',
  'market',
  'festivalLights',
];
