/**
 * The play scene's link to audio: hands it the night's events, says when a night starts or pauses,
 * and how fast the steered beam is turning (for its whir). Audio itself never reads the world.
 */
import type { NightSound } from '../audio';
import type { LevelDef } from '../data/types';
import type { SimEvent } from '../sim/events';
import { wrapAngle } from '../sim/angle';
import type { World } from '../sim/world';
import type { DebugSettings } from '../ui/debugPanel';
import { regionFor, weatherFor } from './playLook';

export interface PlaySound {
  start(level: LevelDef, settings: DebugSettings): void;
  event(event: SimEvent): void;
  paused(on: boolean): void;
  /** After each tick: measures the steered lamp's turn speed. */
  tick(world: World, dt: number): void;
}

export function createPlaySound(sound: NightSound | undefined): PlaySound {
  let lastAngle: number | null = null;
  return {
    start(level, settings) {
      lastAngle = null;
      sound?.nightStarted(regionFor(level, settings), weatherFor(level, settings).rain);
    },
    event(event) {
      sound?.onSimEvent(event);
      // Switching lamps jumps the angle; that isn't the beam turning.
      if (event.type === 'lampSwitched') lastAngle = null;
    },
    paused(on) {
      sound?.setPaused(on);
    },
    tick(world, dt) {
      const { state } = world;
      const angle = (state.activeLamp === 1 && state.lamp2 ? state.lamp2 : state.beam).angle;
      if (lastAngle !== null && dt > 0) sound?.setBeamTurn(wrapAngle(angle - lastAngle) / dt);
      lastAngle = angle;
    },
  };
}
