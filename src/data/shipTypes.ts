/** Types for ships, special ships, ship behaviour, difficulties and the sea. Re-exported from types.ts. */

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
