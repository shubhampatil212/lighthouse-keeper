/**
 * Looking up campaign levels: where a level sits, what comes next, and the LevelDef to play.
 * Levels phase 06 hasn't written yet play their stand-in, renamed and moved into the right region.
 */
import { CAMPAIGN, DEMO_LEVELS, LEVEL_1_2, LEVELS } from '../data';
import type { LevelDef } from '../data/types';
import type { CampaignLevelDef, CampaignRegionDef } from '../data/uiTypes';

export interface LevelPlace {
  region: CampaignRegionDef;
  regionIndex: number;
  level: CampaignLevelDef;
  levelIndex: number;
}

export const ALL_LEVELS: readonly CampaignLevelDef[] = CAMPAIGN.flatMap((r) => r.levels);

export function placeOf(levelId: string): LevelPlace | null {
  for (const [regionIndex, region] of CAMPAIGN.entries()) {
    const levelIndex = region.levels.findIndex((l) => l.id === levelId);
    if (levelIndex >= 0) {
      const level = region.levels[levelIndex];
      if (level) return { region, regionIndex, level, levelIndex };
    }
  }
  return null;
}

/** The level after this one (the next region's first after a finale), or null after the last. */
export function nextLevelId(levelId: string): string | null {
  const i = ALL_LEVELS.findIndex((l) => l.id === levelId);
  return ALL_LEVELS[i + 1]?.id ?? null;
}

/** True when the level is built (not a stand-in). */
export function isBuilt(levelId: string): boolean {
  return levelId in LEVELS;
}

/** The night to play for a campaign level id, or a debug level/demo id. */
export function levelDef(levelId: string): LevelDef {
  const built = LEVELS[levelId] ?? DEMO_LEVELS[levelId];
  if (built) return built;
  const place = placeOf(levelId);
  if (!place) return LEVEL_1_2;
  const standIn = LEVELS[place.level.standIn] ?? DEMO_LEVELS[place.level.standIn] ?? LEVEL_1_2;
  return { ...standIn, id: place.level.id, name: place.level.name, region: place.region.id };
}
