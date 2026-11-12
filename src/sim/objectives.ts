/**
 * Bonus objectives: the extra task a level asks for its third star (docs/GDD.md §3.5).
 * An objective is stateless; its progress is plain data kept in the world, so a night can be
 * copied and replayed exactly.
 */
import type { BonusObjectiveDef, LevelDef } from '../data/types';
import type { SimEvent } from './events';

export interface ObjectiveProgress {
  /** A running count (ships saved of a type, for example). */
  count: number;
  /** Set once the objective can no longer be met. */
  broken: boolean;
  /** Times (seconds) of relevant moments, for objectives about timing. */
  marks: number[];
}

export interface BonusObjective {
  start(): ObjectiveProgress;
  onEvent(progress: ObjectiveProgress, event: SimEvent): void;
  isMet(progress: ObjectiveProgress): boolean;
}

const fresh = (): ObjectiveProgress => ({ count: 0, broken: false, marks: [] });

const NONE: BonusObjective = {
  start: fresh,
  onEvent: () => undefined,
  isMet: () => true,
};

export function createObjective(def: BonusObjectiveDef, level: LevelDef): BonusObjective {
  switch (def.kind) {
    case 'none':
      return NONE;
    case 'saveAllOfType': {
      const needed = level.ships.filter((ship) => ship.type === def.type).length;
      return {
        start: fresh,
        onEvent(progress, event) {
          if (event.type === 'shipSaved' && event.shipType === def.type) progress.count++;
          if (event.type === 'shipWrecked' && event.shipType === def.type) progress.broken = true;
        },
        isMet: (progress) => !progress.broken && needed > 0 && progress.count >= needed,
      };
    }
  }
}
