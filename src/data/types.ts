/** Shapes of every tunable data object. Numbers themselves live in the sibling files. */

import type { ShipTypeId } from './shipTypes';

export type QualityLevel = 'low' | 'medium' | 'high';

/** What the player picks: a fixed level, or Auto (measures and steps down if frames are slow). */
export type QualityChoice = QualityLevel | 'auto';

export interface QualityProfile {
  /** Highest devicePixelRatio the renderer may use at this level. */
  maxPixelRatio: number;
  /** Number of noise layers in the water shader (0 = flat gradient + sprite waves). */
  waterNoiseLayers: number;
  waterSparkles: boolean;
  /** Blur passes on the darkness layer. */
  darknessBlurPasses: number;
  darknessNoise: boolean;
  fogLayers: number;
  fogSpray: boolean;
  particleCap: number;
}

/** Auto quality: starts at Medium and steps down if frames are slow (docs/ART_AUDIO.md). */
export interface AutoQualityConfig {
  start: QualityLevel;
  /** Seconds of frames averaged before each decision. */
  windowSeconds: number;
  /** Drop one level when the average frame takes longer than this (milliseconds). */
  slowFrameMs: number;
  /** Frames longer than this (a hidden tab, a debugger) are ignored (milliseconds). */
  ignoreFrameMs: number;
}

export interface ViewportConfig {
  /** Radius around the island, in world units, that must always be visible. */
  safeRadius: number;
  /** Extra space kept around the safe circle, as a fraction of its radius. */
  edgeMargin: number;
  /**
   * After the phone rotates, the size is measured again this long later (iOS reports the new size
   * late), and the sea is hidden behind a quick fade until then so no stretched frame shows.
   */
  rotateSettleMs: number;
}

export interface LoopConfig {
  /** Simulation steps per second. */
  stepHz: number;
  /** Most simulation steps run in one animation frame before the backlog is dropped. */
  maxCatchUpSteps: number;
}

export interface BeamConfig {
  /** Half-width of the beam cone, in radians. */
  halfAngle: number;
  /** How far the beam reaches, in world units. */
  range: number;
  /** Fastest the beam can turn, in radians per second. */
  turnSpeed: number;
  /** Radius of the always-lit glow around the island, in world units. */
  islandGlowRadius: number;
  /** Turn speed of the self-driven sweep behind menus, in radians per second. */
  idleSweepSpeed: number;
}

export interface IslandShape {
  /** Radius of the island's outline, in world units. */
  radius: number;
}

/** Buildings that appear on the island as the campaign goes on (docs/GDD.md §4), in unlock order. */
export type IslandBuildingId = 'cottage' | 'dock' | 'chapel' | 'market' | 'festivalLights';

/** The five campaign regions (docs/CONTENT.md §6). Each tints the water, darkness and fog. */
export type RegionId =
  'harborBay' | 'northernIce' | 'stormStrait' | 'smugglersCove' | 'archipelago';

/** A region's colors (0xRRGGBB). */
export interface RegionPalette {
  /** Far water and the top of the screen. */
  waterDeep: number;
  /** Near water. */
  waterMid: number;
  /** Wave crests, foam and sparkles. */
  waterCrest: number;
  /** What the darkness multiplies the world by where no light falls. */
  night: number;
  /** Color of the light added where the beam and glows fall (warm amber in most regions). */
  light: number;
  fog: number;
}

/** Weather for a night. Each amount is 0 (none) to 1 (heavy). */
export interface WeatherDef {
  fog: number;
  rain: number;
  snow: number;
}

export interface SceneTransitionConfig {
  /** Length of each half of the fade between screens, in milliseconds. */
  fadeMs: number;
}

export interface BeamUpgradeStep {
  /** Added to the base stat for each upgrade level. */
  perLevel: number;
  maxLevel: number;
}

export interface BeamUpgradeConfig {
  halfAngle: BeamUpgradeStep;
  range: BeamUpgradeStep;
  turnSpeed: BeamUpgradeStep;
}

export interface BeamFeelConfig {
  /**
   * How quickly the beam eases into its target, per second. Near the target the beam turns at
   * (distance × easeRate), capped by the turn speed, which gives the heavy "ease-out" feel.
   */
  easeRate: number;
  /** Below this distance (radians) the beam snaps onto its target. */
  snapAngle: number;
  /** Extra width, in world units, at the cone's side edges that still counts as lit. */
  edgeTolerance: number;
  /** Where the beam points when a night starts (radians; -PI/2 = north/up). */
  startAngle: number;
}

/** Bought upgrade levels the player brings into a night. */
export interface Upgrades {
  lens: number;
  lamp: number;
  gears: number;
  foghorn: number;
  flares: number;
  /** Indexes (into the level's reef list) of reefs that carry a bell buoy. */
  buoys: readonly number[];
}

export type Compass = 'north' | 'east' | 'south' | 'west';

/**
 * One ship in a level's schedule. Give either a compass edge or an exact angle (radians).
 * `harbor` is an index into the level's harbors (left out = the first).
 */
export type ShipSpawnDef =
  | { type: ShipTypeId; at: number; edge: Compass; harbor?: number }
  | { type: ShipTypeId; at: number; angle: number; harbor?: number };

export interface RockDef {
  /** Offset from the reef's centre. */
  dx: number;
  dy: number;
  r: number;
}

export interface ReefDef {
  x: number;
  y: number;
  /** Hand-placed rocks. Left out = generated from the level seed. */
  rocks?: readonly RockDef[];
}

export interface CurrentDef {
  /** Direction the water flows toward (radians). */
  angle: number;
  /** World units per second, before the difficulty multiplier. */
  strength: number;
}

export interface HarborDef {
  x: number;
  y: number;
  radius: number;
}

/**
 * A hazard placed by a level (docs/CONTENT.md §3). Reefs and the current have their own fields.
 * Angles are radians (0 = east, PI/2 = south).
 */
export type HazardDef =
  /** A band of thick fog: a rectangle centred on (x, y), its length running along `angle`. */
  | { kind: 'fogBand'; x: number; y: number; angle: number; length: number; width: number }
  /** A drifting iceberg starting at (x, y). Left-out size, heading and speed come from the level seed. */
  | { kind: 'iceberg'; x: number; y: number; radius?: number; heading?: number; speed?: number }
  | { kind: 'lightning' }
  | { kind: 'stormWaves' }
  | { kind: 'whirlpool'; x: number; y: number }
  /** A pirate ship that sails in from `angle` at `at` seconds. */
  | { kind: 'pirate'; at: number; angle: number };

export type HazardKind = HazardDef['kind'];

/** The extra task a level asks for its third star (docs/GDD.md §3.5). */
export type BonusObjectiveDef =
  | { kind: 'none' }
  /** Every ship of this type gets home. */
  | { kind: 'saveAllOfType'; type: ShipTypeId }
  /** No ship stays in the dark longer than this many seconds. */
  | { kind: 'noLongDark'; seconds: number }
  /** The night ends within this many seconds (stretched by the difficulty's spawn interval). */
  | { kind: 'finishUnder'; seconds: number }
  /** At some point, `count` ships get home within `within` seconds of each other. */
  | { kind: 'savedTogether'; count: number; within: number }
  /** Catch this many smugglers ('all' = every one scheduled). */
  | { kind: 'catchSmugglers'; count: number | 'all' }
  /** Never use this ability tonight. */
  | { kind: 'noAbility'; ability: 'foghorn' | 'flare' }
  /** Drive pirates off with the light this many times. */
  | { kind: 'driveOffPirates'; count: number };

/** Ability levels a level lends for its night, so a tutorial night works before the shop sells it. */
export interface AbilityLoan {
  foghorn?: number;
  flares?: number;
}

/** Lines the scripted tutorial can show (text in src/ui/text/screens.ts). */
export type TutorialPromptId = 'followLight' | 'swingBeam' | 'rocksSeen';

/** What starts a tutorial step. */
export type TutorialTrigger =
  | { kind: 'start' }
  /** The `count`-th ship got home. */
  | { kind: 'saved'; count: number }
  /** The first reef shows in the light. */
  | { kind: 'reefRevealed' };

/** One step of a level's scripted tutorial (docs/GDD.md §7). It never blocks play. */
export interface TutorialStep {
  when: TutorialTrigger;
  prompt: TutorialPromptId | null;
  /** The prompt hides once any ship is lit after the step starts (else after the hint time). */
  hideOnLit?: boolean;
  /** Swing the beam to this angle for the player, for `steerSeconds`. */
  steerTo?: number;
  steerSeconds?: number;
}

export interface StarRules {
  /** ★★ needs at most this many wrecks. */
  twoStarMaxWrecks: number;
  /** ★★★ needs at most this many wrecks, plus the bonus objective. */
  threeStarMaxWrecks: number;
}

/** Endless watch rules (docs/CONTENT.md §7). Times in seconds, before the difficulty's multipliers. */
export interface EndlessConfig {
  /** Seconds between ships at the start; every `rampEvery` s it is multiplied by `rampFactor`. */
  startInterval: number;
  rampEvery: number;
  rampFactor: number;
  minInterval: number;
  /** A new hazard type joins every this many seconds. */
  hazardEvery: number;
  /** Reef clusters on the sea at the start; one more joins every `rampEvery` s, up to `maxReefs`. */
  startReefs: number;
  maxReefs: number;
  /** Reef centres sit this far out (inside the storm-wave limit, so waves can join later). */
  reefDistanceMin: number;
  reefDistanceMax: number;
  /** Open water a new reef keeps from other rocks, and from any ship at sea. */
  reefClearance: number;
  shipClearance: number;
  /** Score = ships saved × scorePerShip + whole seconds survived. */
  scorePerShip: number;
  /** The current's strength (its direction comes from the seed). */
  currentStrength: number;
  /** How often each ship type turns up, relative to the others (only types the keeper has met). */
  shipWeights: Readonly<Partial<Record<ShipTypeId, number>>>;
  /** Where joining hazards are placed. */
  fogDistance: number;
  fogLength: number;
  fogWidth: number;
  icebergDistance: number;
  whirlpoolDistance: number;
}

/** What an endless watch may send: the ship types and hazards the keeper has met. */
export interface WatchDef {
  ships: readonly ShipTypeId[];
  hazards: readonly HazardKind[];
}

/** Coins paid at dawn for stars (docs/GDD.md §4: "coins come from saved ships and star bonuses"). */
export interface StarCoinConfig {
  /** For each star earned for the first time on a level, at that difficulty (before its coin bonus). */
  perNewStar: number;
}

export interface LevelDef {
  id: string;
  name: string;
  region: RegionId;
  /** Left out = the region's usual weather. */
  weather?: WeatherDef;
  /** Seed for the level's fixed layout (generated rocks). */
  seed: number;
  ships: readonly ShipSpawnDef[];
  reefs: readonly ReefDef[];
  hazards: readonly HazardDef[];
  current: CurrentDef;
  /** Left out = one harbor at the island. */
  harbors?: readonly HarborDef[];
  /** A second lighthouse on its own islet (region 5). */
  secondLamp?: { x: number; y: number };
  bonus: BonusObjectiveDef;
  stars: StarRules;
  /** Where the beam points when the night begins (left out = BEAM_FEEL.startAngle). */
  beamStart?: number;
  /** Abilities lent for this night (the night uses the better of these and the keeper's own). */
  loan?: AbilityLoan;
  /** A scripted tutorial (1-1). */
  tutorial?: readonly TutorialStep[];
}

/** How the player swings the beam: point at where it should go, or turn it like a dial. */
export type ControlStyle = 'follow' | 'drag';

export interface ControlsConfig {
  defaultStyle: ControlStyle;
  /** Pointer positions closer than this to the island (CSS px) give no aim; the angle would jitter. */
  deadZonePx: number;
  /** While an arrow key is held, the beam aims this far (radians) ahead of itself, so it turns at full speed. */
  keyboardLead: number;
}

export interface PlayConfig {
  /** Seconds between the night ending and the results screen. */
  endCardDelay: number;
  /** How long a contextual tutorial prompt stays up (seconds). */
  hintSeconds: number;
  /** A tutorial prompt that waits for the player to light a ship stays up at most this long. */
  waitPromptSeconds: number;
}

// The drawing-only look settings (render feel, harbor styles, vessel cues) live in renderTypes.ts.
export type {
  HarborShape,
  HarborStyleConfig,
  RenderFeelConfig,
  VesselFeelConfig,
} from './renderTypes';

// Hazard and ability settings live in hazardTypes.ts.
export type {
  FogConfig,
  IcebergConfig,
  LightningConfig,
  StormWavesConfig,
  WhirlpoolConfig,
  PirateConfig,
  FoghornConfig,
  FlareConfig,
  SecondLampConfig,
  AbilitiesConfig,
  HazardsConfig,
} from './hazardTypes';

// Ship, difficulty and sea settings live in shipTypes.ts.
export type {
  ShipTypeId,
  ShipTypeConfig,
  TugConfig,
  SmugglerConfig,
  ShipBehaviorConfig,
  DifficultyId,
  DifficultyConfig,
  SeaConfig,
} from './shipTypes';
