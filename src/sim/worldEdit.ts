/**
 * Changing a night while it runs: the sandbox adds and clears hazards (and later Endless watch will
 * add them as the night goes on). Ships are sent in with World.launchShip.
 */
import { HAZARDS } from '../data/hazards';
import type { HazardDef, HazardKind } from '../data/types';
import { makeIceberg, nextReefIndex } from './reefs';
import type { Rng } from './rng';
import { startLightning, startWaves } from './storms';
import type { WorldState } from './worldSetup';

/** Runs `use` with the night's hazard random stream (and saves the stream's new state). */
export type WithHazardRng = <T>(use: (rng: Rng) => T) => T;

export function addHazard(
  state: WorldState,
  def: HazardDef,
  withHazardRng: WithHazardRng,
  launchPirate: (angle: number) => void,
): void {
  switch (def.kind) {
    case 'fogBand':
      state.fogBands.push({
        x: def.x,
        y: def.y,
        angle: def.angle,
        length: def.length,
        width: def.width,
      });
      break;
    case 'iceberg': {
      const reef = nextReefIndex(state.rocks);
      state.rocks.push(withHazardRng((rng) => makeIceberg(def, reef, rng, HAZARDS.iceberg)));
      break;
    }
    case 'lightning':
      state.lightning ??= withHazardRng((rng) => startLightning(rng, HAZARDS.lightning));
      break;
    case 'stormWaves':
      state.waves ??= withHazardRng((rng) => startWaves(rng, HAZARDS.stormWaves));
      break;
    case 'whirlpool':
      state.whirlpools.push({ x: def.x, y: def.y });
      break;
    case 'pirate':
      launchPirate(def.angle);
      break;
  }
}

/** Takes every hazard of one kind off the sea. */
export function clearHazard(state: WorldState, kind: HazardKind): void {
  switch (kind) {
    case 'fogBand':
      state.fogBands = [];
      break;
    case 'iceberg':
      state.rocks = state.rocks.filter((r) => r.kind !== 'iceberg');
      break;
    case 'lightning':
      state.lightning = null;
      break;
    case 'stormWaves':
      state.waves = null;
      break;
    case 'whirlpool':
      state.whirlpools = [];
      break;
    case 'pirate':
      state.pirates = [];
      break;
  }
}
