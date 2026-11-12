/**
 * Turns pointer, touch, keyboard and gamepad events into intents for the simulation (phase 02).
 * The simulation only ever sees Intents, never raw events.
 */
export interface Intents {
  /** Where the player wants the beam to point, in radians (0 = east, clockwise on screen). Null = no aim. */
  aimAngle: number | null;
  foghorn: boolean;
  flare: boolean;
  pause: boolean;
}

export const NO_INTENTS: Readonly<Intents> = {
  aimAngle: null,
  foghorn: false,
  flare: false,
  pause: false,
};
