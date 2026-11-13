/**
 * Contextual tutorial prompts: a short line at the bottom of the screen the first time something
 * needs explaining (a ship lost in the dark, a pirate, a smuggler…). Each shows once per visit and
 * never blocks play. Phase 06 adds 1-1's scripted tutorial on top of these.
 */
import { PLAY } from '../data';
import type { SimEvent } from '../sim/events';
import type { HintId } from '../ui/strings';

const shown = new Set<HintId>();

function hintFor(event: SimEvent): HintId | null {
  switch (event.type) {
    case 'shipLost':
      return 'lost';
    case 'shipSpawned':
      return event.shipType === 'smuggler'
        ? 'smuggler'
        : event.shipType === 'ferry'
          ? 'ferry'
          : null;
    case 'pirateArrived':
      return 'pirate';
    case 'shipInWhirlpool':
      return 'whirlpool';
    case 'lightningWarning':
      return 'lightning';
    default:
      return null;
  }
}

export interface PlayHints {
  onEvent(event: SimEvent): void;
  /** Advances the timer; returns the hint to show now, or null. */
  step(dt: number): HintId | null;
  clear(): void;
}

export function createPlayHints(enabled: () => boolean): PlayHints {
  let current: HintId | null = null;
  let left = 0;
  return {
    onEvent(event) {
      const hint = hintFor(event);
      if (!hint || shown.has(hint) || !enabled()) return;
      shown.add(hint);
      current = hint;
      left = PLAY.hintSeconds;
    },
    step(dt) {
      if (current === null) return null;
      left -= dt;
      if (left <= 0 || !enabled()) current = null;
      return current;
    },
    clear() {
      current = null;
    },
  };
}
