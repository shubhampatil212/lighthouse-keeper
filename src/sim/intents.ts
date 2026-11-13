/**
 * What the player wants this tick, already translated from raw input by src/input/.
 * The simulation only ever sees Intents, never raw events.
 */
export interface Intents {
  /** Where the player wants the beam to point, in radians (0 = east, PI/2 = south). Null = keep the last aim. */
  aimAngle: number | null;
  foghorn: boolean;
  flare: boolean;
  /** Switch which lighthouse the player steers (levels with a second lamp). */
  switchLamp: boolean;
  pause: boolean;
}

export const NO_INTENTS: Readonly<Intents> = {
  aimAngle: null,
  foghorn: false,
  flare: false,
  switchLamp: false,
  pause: false,
};
