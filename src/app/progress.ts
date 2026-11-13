/**
 * The keeper's progress: stars, coins, upgrades, buoys and records. Plain data plus pure functions.
 * For now it's kept in memory only (placeholder data, see progressPresets.ts); phase 06 finishes
 * the rules and phase 08 saves it.
 */
import { CAMPAIGN, SHOP } from '../data';
import type { DifficultyId, IslandBuildingId, RegionId, Upgrades } from '../data/types';
import type { ShopUpgradeDef, UpgradeId } from '../data/uiTypes';
import type { LevelResult } from '../sim/events';
import { ALL_LEVELS, placeOf } from './campaign';

export type StarRecord = Partial<Record<DifficultyId, number>>;

export interface Progress {
  /** False until the first-launch difficulty choice has been made. */
  started: boolean;
  coins: number;
  /** Best stars per level id, per difficulty (0 = played but failed). */
  stars: Readonly<Record<string, StarRecord>>;
  upgrades: Readonly<Record<UpgradeId, number>>;
  /** Bell buoys: reef indexes per level id. */
  buoys: Readonly<Record<string, readonly number[]>>;
  shipsSaved: number;
  endlessBest: number;
  /** The level last played, so "Continue" and the map know where the keeper is. */
  lastLevel: string | null;
}

export const NO_UPGRADE_LEVELS: Readonly<Record<UpgradeId, number>> = {
  lens: 0,
  lamp: 0,
  gears: 0,
  foghorn: 0,
  flares: 0,
};

export const NEW_PROGRESS: Progress = {
  started: false,
  coins: 0,
  stars: {},
  upgrades: NO_UPGRADE_LEVELS,
  buoys: {},
  shipsSaved: 0,
  endlessBest: 0,
  lastLevel: null,
};

/** Best stars for a level on any difficulty (or one difficulty). */
export function bestStars(p: Progress, levelId: string, difficulty?: DifficultyId): number {
  const record = p.stars[levelId] ?? {};
  if (difficulty) return record[difficulty] ?? 0;
  return Math.max(0, ...Object.values(record));
}

export function isCleared(p: Progress, levelId: string): boolean {
  return bestStars(p, levelId) > 0;
}

export function isRegionUnlocked(p: Progress, regionIndex: number): boolean {
  if (regionIndex <= 0) return true;
  const previous = CAMPAIGN[regionIndex - 1];
  const finale = previous?.levels[previous.levels.length - 1];
  return finale ? isCleared(p, finale.id) : false;
}

export function isRegionComplete(p: Progress, regionIndex: number): boolean {
  return isRegionUnlocked(p, regionIndex + 1) && regionIndex < CAMPAIGN.length;
}

/** A level is open once its region is, and the level before it in the region is cleared. */
export function isLevelUnlocked(p: Progress, levelId: string): boolean {
  const place = placeOf(levelId);
  if (!place || !isRegionUnlocked(p, place.regionIndex)) return false;
  const before = place.region.levels[place.levelIndex - 1];
  return before ? isCleared(p, before.id) : true;
}

export function regionStars(p: Progress, regionId: RegionId): { got: number; max: number } {
  const region = CAMPAIGN.find((r) => r.id === regionId);
  const levels = region?.levels ?? [];
  return {
    got: levels.reduce((sum, l) => sum + bestStars(p, l.id), 0),
    max: levels.length * 3,
  };
}

export function totalStars(p: Progress, difficulty?: DifficultyId): number {
  return ALL_LEVELS.reduce((sum, l) => sum + bestStars(p, l.id, difficulty), 0);
}

/** Regions finished so far: each adds an island building and a diary page. */
export function regionsComplete(p: Progress): number {
  return CAMPAIGN.filter((_, i) => isRegionComplete(p, i)).length;
}

export function islandBuildings(p: Progress): IslandBuildingId[] {
  return CAMPAIGN.filter((_, i) => isRegionComplete(p, i)).map((r) => r.building);
}

/** GDD §5: endless watch opens after region 1. */
export function isEndlessUnlocked(p: Progress): boolean {
  return isRegionComplete(p, 0);
}

/** Where "Continue" should go: the first open level not yet cleared, or the last one played. */
export function currentLevelId(p: Progress): string {
  const next = ALL_LEVELS.find((l) => isLevelUnlocked(p, l.id) && !isCleared(p, l.id));
  return next?.id ?? p.lastLevel ?? ALL_LEVELS[0]?.id ?? '1-1';
}

export function recordResult(
  p: Progress,
  levelId: string,
  difficulty: DifficultyId,
  result: LevelResult,
): Progress {
  const record = p.stars[levelId] ?? {};
  const best = Math.max(record[difficulty] ?? 0, result.stars);
  return {
    ...p,
    coins: p.coins + result.coins,
    shipsSaved: p.shipsSaved + result.saved,
    stars: { ...p.stars, [levelId]: { ...record, [difficulty]: best } },
    lastLevel: levelId,
  };
}

// ---- Shop ----

const roundTo = (n: number, step: number): number => Math.round(n / step) * step;

export function upgradeCost(def: ShopUpgradeDef, level: number): number {
  return roundTo(def.baseCost * (1 + level * SHOP.costGrowth), SHOP.roundTo);
}

export function isUpgradeForSale(p: Progress, def: ShopUpgradeDef): boolean {
  return def.unlocksAfter === null || isCleared(p, def.unlocksAfter);
}

export function buyUpgrade(p: Progress, def: ShopUpgradeDef): Progress | null {
  const level = p.upgrades[def.id];
  const cost = upgradeCost(def, level);
  if (level >= def.max || p.coins < cost || !isUpgradeForSale(p, def)) return null;
  return { ...p, coins: p.coins - cost, upgrades: { ...p.upgrades, [def.id]: level + 1 } };
}

/** Buoys placed anywhere in the region. */
export function buoysInRegion(p: Progress, regionId: RegionId): number {
  const region = CAMPAIGN.find((r) => r.id === regionId);
  return (region?.levels ?? []).reduce((n, l) => n + (p.buoys[l.id]?.length ?? 0), 0);
}

export function buoyCost(p: Progress, regionId: RegionId): number {
  return SHOP.buoy.baseCost + SHOP.buoy.perOwned * buoysInRegion(p, regionId);
}

export function placeBuoy(p: Progress, levelId: string, reef: number): Progress | null {
  const place = placeOf(levelId);
  if (!place) return null;
  const placed = p.buoys[levelId] ?? [];
  const cost = buoyCost(p, place.region.id);
  if (placed.includes(reef) || p.coins < cost) return null;
  if (buoysInRegion(p, place.region.id) >= SHOP.buoy.maxPerRegion) return null;
  return { ...p, coins: p.coins - cost, buoys: { ...p.buoys, [levelId]: [...placed, reef] } };
}

/** What the keeper brings into a night of `levelId`. */
export function upgradesFor(p: Progress, levelId: string): Upgrades {
  return { ...p.upgrades, buoys: p.buoys[levelId] ?? [] };
}
