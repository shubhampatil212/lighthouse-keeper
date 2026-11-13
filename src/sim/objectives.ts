/**
 * Bonus objectives: the extra task a level asks for its third star (docs/GDD.md §3.5).
 * An objective is stateless; its progress is plain data kept in the world, so a night can be
 * copied and replayed exactly.
 */
import type { BonusObjectiveDef, DifficultyConfig, LevelDef } from '../data/types';
import type { SimEvent } from './events';
import type { Ship } from './ships';

export interface ObjectiveProgress {
  /** A running count (ships saved of a type, for example). */
  count: number;
  /** Set once the objective can no longer be met. */
  broken: boolean;
  /** Ticks of relevant moments, for objectives about timing. */
  marks: number[];
  /** Per-ship timers (seconds), keyed by ship id. */
  timers: Record<string, number>;
}

/** What an objective may look at each tick, besides events. */
export interface ObjectiveView {
  ships: readonly Ship[];
  /** False where no lamp can reach (too far, or behind fog): dark time there doesn't count. */
  reachable: (x: number, y: number) => boolean;
  dt: number;
}

export interface BonusObjective {
  start(): ObjectiveProgress;
  onEvent(progress: ObjectiveProgress, event: SimEvent): void;
  /** Called once per tick while the night is playing. */
  observe(progress: ObjectiveProgress, view: ObjectiveView): void;
  /** `time`: seconds since the night began. */
  isMet(progress: ObjectiveProgress, time: number): boolean;
}

const fresh = (): ObjectiveProgress => ({ count: 0, broken: false, marks: [], timers: {} });
const nothing = (): void => undefined;

const NONE: BonusObjective = {
  start: fresh,
  onEvent: nothing,
  observe: nothing,
  isMet: () => true,
};

/** An objective met by counting events of one kind, broken by another. */
function counting(
  needed: number,
  counts: (event: SimEvent) => boolean,
  breaks: (event: SimEvent) => boolean = () => false,
): BonusObjective {
  return {
    start: fresh,
    onEvent(progress, event) {
      if (counts(event)) progress.count++;
      if (breaks(event)) progress.broken = true;
    },
    observe: nothing,
    isMet: (progress) => !progress.broken && needed > 0 && progress.count >= needed,
  };
}

export function createObjective(
  def: BonusObjectiveDef,
  level: LevelDef,
  difficulty: DifficultyConfig,
  stepHz: number,
): BonusObjective {
  switch (def.kind) {
    case 'none':
      return NONE;
    case 'saveAllOfType':
      return counting(
        level.ships.filter((ship) => ship.type === def.type).length,
        (e) => e.type === 'shipSaved' && e.shipType === def.type,
        (e) => e.type === 'shipWrecked' && e.shipType === def.type,
      );
    case 'catchSmugglers': {
      const scheduled = level.ships.filter((ship) => ship.type === 'smuggler').length;
      return counting(
        def.count === 'all' ? scheduled : def.count,
        (e) => e.type === 'smugglerCaught',
      );
    }
    case 'driveOffPirates':
      return counting(def.count, (e) => e.type === 'pirateDrivenOff');
    case 'noAbility':
      return {
        start: fresh,
        onEvent(progress, event) {
          if (def.ability === 'foghorn' && event.type === 'foghornUsed') progress.broken = true;
          if (def.ability === 'flare' && event.type === 'flareFired') progress.broken = true;
        },
        observe: nothing,
        isMet: (progress) => !progress.broken,
      };
    case 'finishUnder': {
      // Calm spaces the ships out further, so the time allowed stretches with it.
      const limit = def.seconds * difficulty.spawnInterval;
      return {
        start: fresh,
        onEvent: nothing,
        observe: nothing,
        isMet: (_, time) => time <= limit,
      };
    }
    case 'savedTogether': {
      const window = def.within * stepHz;
      return {
        start: fresh,
        onEvent(progress, event) {
          if (event.type !== 'shipSaved') return;
          progress.marks = [...progress.marks, event.tick].filter((t) => event.tick - t <= window);
          progress.count = Math.max(progress.count, progress.marks.length);
        },
        observe: nothing,
        isMet: (progress) => progress.count >= def.count,
      };
    }
    case 'noLongDark':
      return {
        start: fresh,
        onEvent: nothing,
        observe(progress, { ships, reachable, dt }) {
          const timers: Record<string, number> = {};
          for (const ship of ships) {
            // Smugglers want the dark; ships out of the beam's reach can't be helped.
            if (ship.type === 'smuggler' || ship.lit || !reachable(ship.x, ship.y)) continue;
            const t = (progress.timers[ship.id] ?? 0) + dt;
            timers[ship.id] = t;
            if (t > def.seconds) progress.broken = true;
          }
          progress.timers = timers;
        },
        isMet: (progress) => !progress.broken,
      };
  }
}
