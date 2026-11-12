/**
 * Everything the simulation reports to the rest of the game. Audio, effects and UI react to these
 * events; they never poll the simulation's internals. Each event carries the tick it happened on.
 */
import type { ShipTypeId } from '../data/types';

export type LevelOutcome = 'won' | 'failed';
export type FailReason = 'tooManyWrecks' | 'preciousLost';

export interface LevelResult {
  outcome: LevelOutcome;
  failReason: FailReason | null;
  /** 0 when failed, otherwise 1 to 3. */
  stars: number;
  saved: number;
  wrecked: number;
  /** Ships in the level's schedule. */
  total: number;
  coins: number;
  bonusMet: boolean;
  /** Seconds since the night began. */
  time: number;
}

export type SimEvent =
  | {
      type: 'shipSpawned';
      tick: number;
      shipId: number;
      shipType: ShipTypeId;
      x: number;
      y: number;
    }
  | { type: 'shipLit'; tick: number; shipId: number }
  | { type: 'shipLost'; tick: number; shipId: number }
  | {
      type: 'shipSaved';
      tick: number;
      shipId: number;
      shipType: ShipTypeId;
      coins: number;
      x: number;
      y: number;
    }
  | {
      type: 'shipWrecked';
      tick: number;
      shipId: number;
      shipType: ShipTypeId;
      reefIndex: number;
      x: number;
      y: number;
    }
  | { type: 'reefRevealed'; tick: number; reefIndex: number }
  | { type: 'levelEnded'; tick: number; result: LevelResult };

export type SimEventType = SimEvent['type'];

/** Queues an event for the rest of the game. */
export type Emit = (event: SimEvent) => void;
