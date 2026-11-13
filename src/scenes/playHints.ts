/**
 * Contextual tutorial prompts: a short line at the bottom of the screen the first time something
 * needs explaining (a ship lost in the dark, a new ship type or hazard, a new ability). Each shows
 * once per visit and never blocks play. Level 1-1's scripted tutorial (tutorial.ts) sits on top.
 */
import { PLAY } from '../data';
import type { LevelDef, Upgrades } from '../data/types';
import type { SimEvent } from '../sim/events';
import type { HintId } from '../ui/strings';

const shown = new Set<HintId>();

function hintFor(event: SimEvent): HintId | null {
  switch (event.type) {
    case 'shipLost':
      return 'lost';
    case 'shipSpawned':
      switch (event.shipType) {
        case 'smuggler':
        case 'ferry':
        case 'cargo':
        case 'sailboat':
        case 'tugboat':
          return event.shipType;
        default:
          return null;
      }
    case 'reefRevealed':
      return event.kind === 'iceberg' ? 'iceberg' : null;
    case 'pirateArrived':
      return 'pirate';
    case 'shipInWhirlpool':
      return 'whirlpool';
    case 'lightningWarning':
      return 'lightning';
    case 'wavesShifted':
      return 'waves';
    default:
      return null;
  }
}

/** What's new on the sea from the first moment of the night. */
function startHints(level: LevelDef, upgrades: Upgrades): HintId[] {
  const hints: HintId[] = [];
  if (upgrades.foghorn > 0) hints.push('foghorn');
  if (upgrades.flares > 0) hints.push('flare');
  if (level.secondLamp) hints.push('secondLamp');
  if ((level.harbors?.length ?? 1) > 1) hints.push('harbors');
  if (level.hazards.some((h) => h.kind === 'fogBand')) hints.push('fog');
  return hints;
}

export interface PlayHints {
  /** A night begins (with the upgrades it really uses, loans included). */
  onNightStart(level: LevelDef, upgrades: Upgrades): void;
  onEvent(event: SimEvent): void;
  /** Advances the timer; returns the hint to show now, or null. */
  step(dt: number): HintId | null;
  clear(): void;
}

export function createPlayHints(enabled: () => boolean): PlayHints {
  let current: HintId | null = null;
  let left = 0;
  let queue: HintId[] = [];
  const offer = (hint: HintId | null): void => {
    if (!hint || shown.has(hint) || !enabled()) return;
    shown.add(hint);
    queue.push(hint);
  };
  return {
    onNightStart(level, upgrades) {
      for (const hint of startHints(level, upgrades)) offer(hint);
    },
    onEvent(event) {
      offer(hintFor(event));
    },
    step(dt) {
      if (!enabled()) {
        current = null;
        queue = [];
        return null;
      }
      if (current !== null) {
        left -= dt;
        if (left <= 0) current = null;
      }
      if (current === null) {
        current = queue.shift() ?? null;
        left = PLAY.hintSeconds;
      }
      return current;
    },
    clear() {
      current = null;
      queue = [];
    },
  };
}
