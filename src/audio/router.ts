/**
 * Turns simulation events into sounds and into the music's tension. It only ever sees events
 * (CLAUDE.md rule 6): which ships are in danger is worked out from shipInDanger and the events
 * that end it, never by looking inside the simulation.
 */
import { AUDIO } from '../data';
import type { SfxId } from '../data/soundTypes';
import type { SimEvent } from '../sim/events';

/** Left/right position of a sound made at world x (the island is at 0). */
export const panFor = (x: number): number =>
  Math.max(-1, Math.min(1, x / AUDIO.panRange)) * AUDIO.panWidth;

export interface NightListener {
  onEvent(event: SimEvent): void;
  /** A new night (or a restart): forget every ship. */
  reset(): void;
  /** True while any ship is lost in the dark or close to a reef. */
  readonly tense: boolean;
}

export function createNightListener(play: (id: SfxId, pan: number) => void): NightListener {
  const danger = new Set<number>();
  /** "Ship lit for the first time": each ship's bell rings once a night. */
  const greeted = new Set<number>();
  let ended = false;

  const calm = (shipId: number): void => {
    danger.delete(shipId);
  };

  return {
    get tense() {
      return !ended && danger.size > 0;
    },
    reset() {
      danger.clear();
      greeted.clear();
      ended = false;
    },
    onEvent(e) {
      switch (e.type) {
        case 'shipLit':
          calm(e.shipId);
          if (!greeted.has(e.shipId)) {
            greeted.add(e.shipId);
            play('shipLit', panFor(e.x));
          }
          break;
        case 'shipLost':
        case 'shipInDanger':
          danger.add(e.shipId);
          break;
        case 'shipOutOfDanger':
        case 'smugglerEscaped':
          calm(e.shipId);
          break;
        case 'shipSaved':
          calm(e.shipId);
          play('shipHome', panFor(e.x));
          break;
        case 'shipWrecked':
          calm(e.shipId);
          play('wreck', panFor(e.x));
          break;
        case 'smugglerCaught':
          calm(e.shipId);
          play('smugglerCaught', panFor(e.x));
          break;
        case 'reefRevealed':
          play('reefRevealed', panFor(e.x));
          break;
        case 'buoyRang':
          play('buoyBell', panFor(e.x));
          break;
        case 'pirateArrived':
          play('pirateArrived', panFor(e.x));
          break;
        case 'foghornUsed':
          play('foghorn', 0);
          break;
        case 'flareFired':
          play('flare', 0);
          break;
        case 'lampSwitched':
          play('lampSwitched', 0);
          break;
        case 'abilityUnavailable':
          play('abilityUnavailable', 0);
          break;
        case 'lightning':
          play('lightning', 0);
          break;
        case 'levelEnded':
          ended = true;
          danger.clear();
          break;
        default:
          break;
      }
    },
  };
}
