/**
 * Turns pointer, touch and keyboard events into intents for the simulation.
 * The simulation only ever sees Intents, never raw events.
 */
export type { Intents } from '../sim/intents';
export { NO_INTENTS } from '../sim/intents';
export * from './aim';
export * from './controller';
