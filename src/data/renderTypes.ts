/**
 * Types for the drawing-only settings: how the night looks and moves, harbor marker styles, and the
 * vessel cues. None of these change the simulation. Re-exported from types.ts.
 */

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
  /**
   * High-contrast reefs (accessibility): a brighter, thicker outline in this color, with longer
   * dashes, that fades `memoryHighLasts` times more slowly than the reef's memory.
   */
  memoryHigh: {
    color: number;
    alpha: number;
    width: number;
    dash: number;
    gap: number;
    lasts: number;
  };
  /** Reduced motion: fog, waves and the sea move at this fraction of their speed. */
  reducedMotionSea: number;
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
  /** A rock rising out of the dark starts this much larger (×) and settles as it fades in. */
  revealSettle: number;
  /** The coin pop waits this long after the save ring starts, so ring and coins read one after the other. */
  coinPopDelay: number;
  /** Camera shake on a wreck: strength in CSS px and how long it lasts. */
  shakeStrength: number;
  shakeSeconds: number;
  /** The shake builds to full strength over this many seconds instead of starting with a jolt. */
  shakeRise: number;
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
  /** Ships lean into a turn: roll (radians) per radian per second of turning, and its limit. */
  turnLean: number;
  turnLeanMax: number;
  /** The moment a ship is first lit its lantern flares: extra glow (×) fading over this many seconds. */
  catchLight: number;
  catchLightSeconds: number;
  /** The "?" over a lost ship pops in (grows past full size and settles) over this many seconds. */
  lostMarkerPop: number;
  /** A wake is drawn as this many strokes, fading from the stern (fewer = cheaper). */
  wakeBands: number;
  /**
   * On small screens ships are drawn larger than their collision size so they stay readable: below
   * `belowScale` CSS px per world unit, by up to `scale` (drawing only; collisions don't change).
   */
  smallScreen: { belowScale: number; scale: number };
}
