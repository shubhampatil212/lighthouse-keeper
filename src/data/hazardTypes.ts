/** Types for the hazards (fog, icebergs, lightning, storm waves, whirlpools, pirates) and the abilities. Re-exported from types.ts. */

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
