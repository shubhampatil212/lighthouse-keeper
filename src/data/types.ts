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

/** Every ship type in docs/CONTENT.md §2. */
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
  /** How strongly the wind (the current) pushes it while dark. 1 = like every other ship. */
  windFactor: number;
}

/** The tugboat's towing: while lit, it slows dark ships near it (docs/CONTENT.md §2). */
export interface TugConfig {
  /** Dark ships closer than this (world units, centre to centre) are slowed. */
  towRadius: number;
  /** Their speed is multiplied by this. */
  speedFactor: number;
}

/** The smuggler and the coast guard boat that tows it away (docs/CONTENT.md §2). */
export interface SmugglerConfig {
  /** Seconds of unbroken light that catch it. */
  catchSeconds: number;
  /** Coins for a catch, before the difficulty multiplier. */
  catchBonus: number;
  /**
   * In the dark it crosses the sea toward an exit point on the spawn ring. The exit sits this far
   * (radians, random between min and max, either side) from the point straight across, so its path
   * misses the island.
   */
  exitOffsetMin: number;
  exitOffsetMax: number;
  /** It counts as escaped once this far outside the spawn ring. */
  escapeMargin: number;
  /** Coast guard boat: speed out to the smuggler, turn rate, towing speed, and how close it must get to hook on. */
  coastGuardSpeed: number;
  coastGuardTurnRate: number;
  towSpeed: number;
  hookDistance: number;
  /** The tow is removed once the smuggler is this far past the spawn ring. */
  towClearance: number;
  /** Coast guard boat size (it's drawn and lit like a ship). */
  coastGuardLength: number;
  coastGuardWidth: number;
}

export interface ShipBehaviorConfig {
  /** Lit ships bound for another harbor steer around the island as if it were a rock of its radius plus this. */
  islandAvoidPadding: number;
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
  /** Music tension (docs/ART_AUDIO.md): a ship is "in danger" after this long in the dark… */
  dangerDarkAfter: number;
  /** …or while dark within this distance of a rock's edge (world units). */
  dangerReefDistance: number;
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
  /**
   * A level's current (after difficulty and wind) may be at most this share of the slowest ship's
   * dark speed, so a drifting ship always makes headway and the night always ends.
   */
  currentMaxShare: number;
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

export interface FogConfig {
  /** The beam's range is multiplied by this for anything it has to reach through fog. */
  rangeFactor: number;
  /**
   * Fairness: no rock may sit behind a fog band (seen from a lamp), and every rock keeps this much
   * open water from any band, so a ship leaving the fog has time to be lit before it reaches rock.
   */
  rockClearance: number;
}

export interface IcebergConfig {
  radiusMin: number;
  radiusMax: number;
  speedMin: number;
  speedMax: number;
  /**
   * A ship sailing into an iceberg wrecks only if its heading points at the iceberg's centre within
   * this cosine (0.5 = within 60°). An iceberg drifting into a ship's side shoves it aside instead.
   */
  headOnCos: number;
  /**
   * Icebergs bounce to stay in the fair zone: their outer edge stays within the reef limit
   * (base range minus the reef margin) and their inner edge this far outside the harbor.
   */
  harborGap: number;
  /** They also bounce off rocks and other icebergs, keeping at least this much open water between. */
  laneGap: number;
}

export interface LightningConfig {
  /** Seconds between strikes (random between min and max). */
  intervalMin: number;
  intervalMax: number;
  /** Seconds of warning glow before each strike. */
  warning: number;
  /** Seconds the whole map stays lit. */
  flash: number;
}

export interface StormWavesConfig {
  /** World units per second; pushes every ship, lit or dark. */
  push: number;
  /** Seconds between changes of direction. */
  period: number;
  /**
   * Fairness: on a level with storm waves, rocks must sit this much further inside the beam's reach
   * than SeaConfig.reefRangeMargin, because dark ships drift faster.
   */
  extraReefMargin: number;
}

export interface WhirlpoolConfig {
  /** Ships inside this radius are pulled toward the centre. */
  pullRadius: number;
  /** Ships whose centre enters this radius are wrecked. */
  coreRadius: number;
  /** Pull at the centre (world units per second); it fades to 0 at the edge. */
  maxPull: number;
  /** Lit ships steer around the core as if it were a rock of coreRadius, with this much room. */
  avoidPadding: number;
}

export interface PirateConfig {
  length: number;
  width: number;
  /** Speeds: patrolling, hunting, and fleeing from the light. */
  patrolSpeed: number;
  huntSpeed: number;
  fleeSpeed: number;
  /** Turn rate (radians per second). */
  turnRate: number;
  /** It circles the island at this distance while it has no prey. */
  patrolRadius: number;
  /** It hunts dark ships within this distance of itself. */
  huntRadius: number;
  /**
   * Fairness: it only hunts ships inside the base beam range (so the player can always light them),
   * and must chase a ship for this long before it can board it. This is the player's reaction window.
   */
  boardDelay: number;
  /** Seconds it keeps away after the light last touched it. */
  scareSeconds: number;
  /** It steers around rocks with this much room (it never wrecks; it knows these waters). */
  avoidPadding: number;
}

export interface FoghornConfig {
  /** Ships within this distance of the island are slowed. */
  radius: number;
  /** Their speed is multiplied by this. */
  speedFactor: number;
  /** Seconds the slow lasts. */
  duration: number;
  /** Cooldown at upgrade level 1, and what each further level takes off it. */
  cooldown: number;
  cooldownPerLevel: number;
}

export interface FlareConfig {
  /** Seconds the whole map stays lit. */
  seconds: number;
}

export interface SecondLampConfig {
  /** Radius of the rocky islet the second tower stands on (ships steer around it). */
  isletRadius: number;
  /** Always-lit glow around the second tower. */
  glowRadius: number;
  /** How fast the lamp you aren't steering sweeps on its own (radians per second). */
  sweepSpeed: number;
}

export interface AbilitiesConfig {
  foghorn: FoghornConfig;
  flare: FlareConfig;
  secondLamp: SecondLampConfig;
}

export interface HazardsConfig {
  fog: FogConfig;
  iceberg: IcebergConfig;
  lightning: LightningConfig;
  stormWaves: StormWavesConfig;
  whirlpool: WhirlpoolConfig;
  pirate: PirateConfig;
}

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
  // Environment hazards and abilities (phase 04).
  /** Radius of the ring round the island when the island's lamp is the one being steered. */
  activeLampRing: number;
  /** Fog band puffs: opacity in the dark, extra opacity where lit, and drift speed. */
  fogBandAlpha: number;
  fogBandLitBoost: number;
  fogBandDrift: number;
  /** Whirlpool spiral: opacity in the dark and when lit, and turning speed (radians per second). */
  whirlpoolDarkAlpha: number;
  whirlpoolLitAlpha: number;
  whirlpoolSpin: number;
  /** Storm-wave crests: how many, their length (world units), speed and opacity; seconds the direction arrow shows. */
  waveStreaks: number;
  waveCrestLength: number;
  waveSpeed: number;
  waveAlpha: number;
  waveCueSeconds: number;
  /** Lightning: warning glow opacity, flash opacity and flash length (seconds). */
  lightningWarnAlpha: number;
  lightningFlashAlpha: number;
  lightningFlashSeconds: number;
  /** Flare: how high it climbs above the lamp (world units) and how long it shows (matches the map light). */
  flareRise: number;
  flareSeconds: number;
  /** Radius of the flare's glow (world units). */
  flareGlowRadius: number;
  /** Seconds each foghorn ring takes to roll out. */
  hornRingSeconds: number;
}

/** Marker shape for a harbor in colorblind mode (docs/ART_AUDIO.md: "never rely on color alone"). */
export type HarborShape = 'circle' | 'triangle';

/** Destination colors for harbors, by harbor index. */
export interface HarborStyleConfig {
  /** Normal colors (0xRRGGBB): red and blue. */
  colors: readonly number[];
  /** Colorblind mode: blue and orange, plus a shape marker. */
  colorblindColors: readonly number[];
  shapes: readonly HarborShape[];
}

/** How the phase 04 vessel cues look (drawing only; world units and seconds). */
export interface VesselFeelConfig {
  /** Destination marker beside a ship's lantern: size, and its offset from the lantern. */
  destinationSize: number;
  destinationOffsetX: number;
  destinationOffsetY: number;
  /** Smuggler catch ring: radius around the ship and line width. */
  catchRingRadius: number;
  catchRingWidth: number;
  /** Pirate "closing in" cue on its prey: the ring starts this big and shrinks to the hull. */
  huntRingStart: number;
  huntRingEnd: number;
  /** Pirate lantern pulse speed while hunting, at the end of the boarding window (pulses per second). */
  huntPulse: number;
  /** Tug tow line and coast guard tow line: width and brightness. */
  ropeWidth: number;
  ropeAlpha: number;
  /** "Slowed by the foghorn" marker: size of its sound arcs. */
  slowedSize: number;
  /** Lights ringing each harbor when a night has more than one: how many, and their glow radius. */
  harborLights: number;
  harborLightRadius: number;
  /** A towed smuggler is drawn at this brightness. */
  towedDim: number;
}
