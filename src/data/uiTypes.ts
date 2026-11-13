/** Shapes of the menu, campaign, shop and settings data (the game-world shapes are in types.ts). */
import type {
  ControlStyle,
  DifficultyId,
  IslandBuildingId,
  QualityChoice,
  RegionId,
  ShipTypeId,
} from './types';

/** Upgrades sold in the Harbor shop, apart from bell buoys. */
export type UpgradeId = 'lens' | 'lamp' | 'gears' | 'foghorn' | 'flares';

export interface ShopUpgradeDef {
  id: UpgradeId;
  baseCost: number;
  max: number;
  /** The level that must be finished before it's sold (null = from the start). */
  unlocksAfter: string | null;
}

export interface ShopConfig {
  /** Cost = round to `roundTo` of base × (1 + level × costGrowth) (docs/CONTENT.md §4). */
  costGrowth: number;
  roundTo: number;
  upgrades: readonly ShopUpgradeDef[];
  buoy: {
    baseCost: number;
    /** Added to the price for each buoy already owned in that region. */
    perOwned: number;
    maxPerRegion: number;
  };
}

/** Sea hazards and features listed in the logbook. */
export type SeaFeatureId =
  | 'reef'
  | 'current'
  | 'fogBand'
  | 'iceberg'
  | 'lightning'
  | 'stormWaves'
  | 'whirlpool'
  | 'pirate'
  | 'secondHarbor';

/** Abilities a briefing can introduce. */
export type AbilityIntroId = 'foghorn' | 'flares' | 'secondLamp';

/** What a level brings in for the first time (shown on its briefing). */
export type IntroId = ShipTypeId | SeaFeatureId | AbilityIntroId | 'pairs' | 'rush' | 'finale';

export interface CampaignLevelDef {
  id: string;
  name: string;
  introduces: IntroId | null;
  /**
   * Until phase 06 writes this level, playing it loads this level (or debug demo) instead,
   * renamed and tinted for the region.
   */
  standIn: string;
}

export interface CampaignRegionDef {
  id: RegionId;
  /** The building the island gains when the region's last level is finished. */
  building: IslandBuildingId;
  /** Where the region sits on the sea chart (percent of the chart's width and height). */
  chart: { x: number; y: number };
  levels: readonly CampaignLevelDef[];
}

/** Every player setting from docs/SCREENS.md (Settings). */
export interface GameSettings {
  /** Volumes, 0–100. */
  master: number;
  music: number;
  effects: number;
  ambience: number;
  muted: boolean;
  quality: QualityChoice;
  showFps: boolean;
  screenShake: boolean;
  difficulty: DifficultyId;
  beamControl: ControlStyle;
  leftHanded: boolean;
  tutorialPrompts: boolean;
  reducedMotion: boolean;
  colorblind: boolean;
  highContrastReefs: boolean;
  largerText: boolean;
  haptics: boolean;
}

/** Timing and thresholds for menus, the HUD and the results screen. */
export interface UiFeelConfig {
  /** The menu backdrop's beam sweeps at this speed (rad/s). */
  menuSweepSpeed: number;
  /** Results: the dawn sky takes this long; the first star waits `starDelayMs`, then one every `starIntervalMs`. */
  dawnMs: number;
  starDelayMs: number;
  starIntervalMs: number;
  /** How long a short notice ("toast") stays up. */
  toastMs: number;
  /** Fail tips: a wreck counts as "lost in the dark" if the ship had been dark this long. */
  darkTipSeconds: number;
  /** Fail tips: a cause is "what went wrong" when at least this share of the wrecks had it. */
  tipShare: number;
  /** A ship counts as "lit late" when it was lit less than this long before it wrecked. */
  lateLightSeconds: number;
}

/** The sea chart's drawing: paper size and the coastline (points in percent of the chart). */
export interface ChartConfig {
  width: number;
  height: number;
  coast: readonly (readonly [number, number])[];
  /** Level select: the six buoys along the route (percent of the panel). */
  route: readonly (readonly [number, number])[];
}
