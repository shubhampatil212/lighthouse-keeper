/**
 * Looking up campaign levels: where a level sits, what comes next, and the LevelDef to play.
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

/** The night to play for a campaign level id, or a debug demo id (unknown ids play 1-2). */
export function levelDef(levelId: string): LevelDef {
  return LEVELS[levelId] ?? DEMO_LEVELS[levelId] ?? LEVEL_1_2;
}
