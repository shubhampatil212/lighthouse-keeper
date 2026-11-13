/**
 * Everything the simulation reports to the rest of the game. Audio, effects and UI react to these
 * events; they never poll the simulation's internals. Each event carries the tick it happened on.
 */
import type { ShipTypeId } from '../data/types';
import type { RockKind } from './reefs';

export type LevelOutcome = 'won' | 'failed';
export type FailReason = 'tooManyWrecks' | 'preciousLost';

/** What sank a ship. */
export type WreckCause = 'reef' | 'iceberg' | 'whirlpool' | 'pirate';

export type AbilityId = 'foghorn' | 'flare' | 'switchLamp';

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
  /** Smugglers caught, and smugglers that got away. */
  caught: number;
  escaped: number;
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
      cause: WreckCause;
      /** The reef (or iceberg) it hit; null for whirlpools and pirates. */
      reefIndex: number | null;
      x: number;
      y: number;
    }
  | { type: 'reefRevealed'; tick: number; reefIndex: number; kind: RockKind; x: number; y: number }
  // Ships with special rules.
  | { type: 'smugglerCaught'; tick: number; shipId: number; coins: number; x: number; y: number }
  | { type: 'smugglerEscaped'; tick: number; shipId: number }
  /** The coast guard boat has reached a caught smuggler and starts towing it away. */
  | { type: 'smugglerTowed'; tick: number; shipId: number; x: number; y: number }
  /** A lit tugboat has started slowing a dark ship. */
  | { type: 'tugTowing'; tick: number; tugId: number; shipId: number }
  /** A ship has sailed into a lit bell buoy's circle, and the bell rings. */
  | { type: 'buoyRang'; tick: number; buoyIndex: number; shipId: number; x: number; y: number }
  // Abilities.
  | { type: 'foghornUsed'; tick: number; shipIds: readonly number[] }
  | { type: 'flareFired'; tick: number; chargesLeft: number }
  | { type: 'lampSwitched'; tick: number; lamp: number }
  /** The player pressed an ability that is cooling down, used up, or not owned. */
  | {
      type: 'abilityUnavailable';
      tick: number;
      ability: AbilityId;
      reason: 'cooldown' | 'empty' | 'locked';
    }
  // Hazards.
  | { type: 'lightningWarning'; tick: number; inSeconds: number }
  | { type: 'lightning'; tick: number }
  | { type: 'wavesShifted'; tick: number; angle: number }
  | { type: 'shipInWhirlpool'; tick: number; shipId: number; whirlpool: number }
  | { type: 'pirateArrived'; tick: number; pirateId: number; x: number; y: number }
  | { type: 'pirateHunting'; tick: number; pirateId: number; shipId: number }
  | { type: 'pirateDrivenOff'; tick: number; pirateId: number }
  | { type: 'levelEnded'; tick: number; result: LevelResult };

export type SimEventType = SimEvent['type'];

/** Queues an event for the rest of the game. */
export type Emit = (event: SimEvent) => void;
