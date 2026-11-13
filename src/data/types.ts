/** Shapes of every tunable data object. Numbers themselves live in the sibling files. */

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

/** Every ship type in docs/CONTENT.md §2. Sailboat, ferry, tugboat and smuggler behaviors arrive in phase 04. */
export type ShipTypeId = 'fishing' | 'cargo' | 'sailboat' | 'ferry' | 'tugboat' | 'smuggler';

export interface ShipTypeConfig {
  /** Full speed, world units per second. */
  speed: number;
  /** Hull length and width, world units. */
  length: number;
  width: number;
  /** Coins for bringing it home (before the difficulty multiplier). */
  coins: number;
  /** Multiplies every turn rate (lit and dark). Below 1 = turns slowly. */
  turnRateMultiplier: number;
  /** A lit ship avoids a rock when closer than (rock radius + this). */
  avoidPadding: number;
  /** If it wrecks, the night fails. */
  precious: boolean;
}

export interface ShipBehaviorConfig {
  /** Dark ships move at this fraction of their full speed. */
  darkSpeedFactor: number;
  /** Dark ships' heading error eases toward a random target within ± this (radians). */
  darkErrorRange: number;
  /** Seconds between new heading-error targets (random between min and max). */
  darkErrorRerollMin: number;
  darkErrorRerollMax: number;
  /** How fast the heading error eases toward its target, per second. */
  darkErrorEase: number;
  /** Heading error a ship spawns with (random within ±). */
  spawnErrorRange: number;
  /** Seconds until the first heading-error re-roll after spawning. */
  spawnErrorDelay: number;
  /** Spawn heading = toward the harbor ± this (radians). */
  spawnHeadingJitter: number;
  /** Turn rates in radians per second (multiplied by the ship type's turnRateMultiplier). */
  litTurnRate: number;
  darkTurnRate: number;
  /** Seconds in the dark before a ship counts as lost (shows the "?" marker). */
  lostAfter: number;
  /** Reef avoidance: only rocks at least this "ahead" (cosine) are avoided. */
  avoidAheadCos: number;
  /** Reef avoidance push strength at the rock's edge. */
  avoidStrength: number;
  /** How much of the push goes sideways (around the rock) compared to straight away. */
  avoidTangentFactor: number;
  /** A ship hits a rock when closer than rock radius + width × this. */
  hullCollisionFactor: number;
  /** Seconds between wake points and how many are kept. */
  wakeInterval: number;
  wakeLength: number;
}

export type DifficultyId = 'calm' | 'keeper' | 'storm';

export interface DifficultyConfig {
  shipSpeed: number;
  spawnInterval: number;
  currentStrength: number;
  /** Wrecks the player can afford; one more fails the night. */
  wreckAllowance: number;
  /** Seconds a reef's outline stays visible after the light leaves it. */
  reefMemory: number;
  coinReward: number;
}

export interface SeaConfig {
  /** Ships appear on this circle around the island (world units). */
  spawnRadius: number;
  /** Half-width (radians) of the window an edge spawn is picked from. */
  edgeSpawnSpread: number;
  /** The harbor zone around the island when a level doesn't list harbors. */
  defaultHarborRadius: number;
  /** Radius a bell buoy lights around its reef. */
  buoyRadius: number;
  /** Generated rocks: radius range, rocks per reef and spread around the reef's centre. */
  rockRadiusMin: number;
  rockRadiusMax: number;
  rocksPerReefMin: number;
  rocksPerReefMax: number;
  rockSpread: number;
  /**
   * Fairness: every rock's outer edge must sit at least this far inside the base beam range, so a
   * ship drifting toward it is in reach of the light for long enough to be saved.
   */
  reefRangeMargin: number;
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

/** One ship in a level's schedule. Give either a compass edge or an exact angle (radians). */
export type ShipSpawnDef =
  { type: ShipTypeId; at: number; edge: Compass } | { type: ShipTypeId; at: number; angle: number };

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

export type BonusObjectiveDef = { kind: 'none' } | { kind: 'saveAllOfType'; type: ShipTypeId };

export interface StarRules {
  /** ★★ needs at most this many wrecks. */
  twoStarMaxWrecks: number;
  /** ★★★ needs at most this many wrecks, plus the bonus objective. */
  threeStarMaxWrecks: number;
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
  /** Hazards arrive in phase 04. */
  hazards: readonly never[];
  current: CurrentDef;
  /** Left out = one harbor at the island. */
  harbors?: readonly HarborDef[];
  bonus: BonusObjectiveDef;
  stars: StarRules;
  /** Tutorial prompts arrive with level 1-1 in phase 06. */
  tutorial?: readonly never[];
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
  /** Seconds between the night ending and the end card appearing. */
  endCardDelay: number;
}

/** How the night looks and moves. Drawing only: none of this changes the simulation. */
export interface RenderFeelConfig {
  /** The light map is drawn at this fraction of the screen's resolution (it's blurred anyway). */
  lightMapResolution: number;
  /** Strength (0–1) of the light added inside the beam, around the island, under buoys and under lanterns. */
  beamLight: number;
  islandLight: number;
  buoyLight: number;
  lanternLight: number;
  /** Radius of the small pool of light under a lantern, world units. */
  lanternPoolRadius: number;
  /** Strength of the soft halo just outside the cone (the beam's wide edge), 0–1. */
  beamHalo: number;
  /** The halo is this many times wider than the cone. */
  beamHaloWidth: number;
  /** High quality: how strongly noise makes the beam edge "breathe" (0–1), and how fast it moves. */
  beamBreath: number;
  beamBreathSpeed: number;
  /** Strength of the glow shaft from the lamp glass, and how far along the beam it reaches (fraction of range). */
  shaftAlpha: number;
  shaftReach: number;
  /** Lamp bloom radius (world units) and how much the lamp glass flickers (0–1). */
  bloomRadius: number;
  lampFlicker: number;
  /** Seconds a hull, sail or rock takes to fade in or out when the light reaches or leaves it. */
  revealFade: number;
  /** Ship bobbing (world units up and down) and roll (radians), with their speeds. */
  bobHeight: number;
  bobSpeed: number;
  rollAngle: number;
  rollSpeed: number;
  /** Lantern glow radius (world units): in the dark, and when lit. */
  lanternGlowDark: number;
  lanternGlowLit: number;
  /** Wake: line width (world units) and brightness at the ship. */
  wakeWidth: number;
  wakeAlpha: number;
  /** "Lost" marker pulse speed. */
  lostPulseSpeed: number;
  /** Edge arrows: seconds before a ship appears that its arrow shows, and the arrow's distance from the screen edge (CSS px). */
  arrowLookAhead: number;
  arrowInset: number;
  arrowSize: number;
  /** Reef memory outline: dash and gap length (world units) and brightness at full memory. */
  memoryDash: number;
  memoryGap: number;
  memoryAlpha: number;
  /** Foam ring around rocks: how far it reaches past the rock and how much it pulses (world units). */
  foamReach: number;
  foamPulse: number;
  /** Fog: drift speeds of the two layers (CSS px per second) and their opacity at fog amount 1. */
  fogSpeedNear: number;
  fogSpeedFar: number;
  fogAlphaNear: number;
  fogAlphaFar: number;
  /** Rain and snow particles alive at amount 1 (still limited by the quality's particle cap). */
  rainDrops: number;
  snowFlakes: number;
  /** Effects. */
  rippleSeconds: number;
  rippleRadius: number;
  splinterCount: number;
  splinterSeconds: number;
  foamBurstCount: number;
  foamSeconds: number;
  coinPopSeconds: number;
  /** Camera shake on a wreck: strength in CSS px and how long it lasts. */
  shakeStrength: number;
  shakeSeconds: number;
}
