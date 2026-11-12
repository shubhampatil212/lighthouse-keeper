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
