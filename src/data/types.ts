/** Shapes of every tunable data object. Numbers themselves live in the sibling files. */

export type QualityLevel = 'low' | 'medium' | 'high';

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

export type ShipTypeId = 'fishing' | 'cargo';

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
