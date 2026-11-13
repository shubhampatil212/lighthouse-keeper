/**
 * Small helpers the harbor gives the keeper: a lit tugboat slows the dark ships near it ("tows them"),
 * and a bell buoy rings when a ship sails into its light.
 */
import type { TugConfig } from '../data/types';
import type { BuoyLight } from './beam';
import type { Emit } from './events';
import type { Ship } from './ships';

/** Marks which dark ships a lit tugboat is slowing this tick (uses last tick's light). */
export function towWithTugs(
  ships: readonly Ship[],
  config: TugConfig,
  tick: number,
  emit: Emit,
): void {
  const tugs = ships.filter((s) => s.type === 'tugboat' && s.lit);
  for (const ship of ships) {
    let by = 0;
    if (!ship.lit) {
      for (const tug of tugs) {
        if (tug.id === ship.id) continue;
        if (Math.hypot(tug.x - ship.x, tug.y - ship.y) < config.towRadius) {
          by = tug.id;
          break;
        }
      }
    }
    if (by !== 0 && by !== ship.towedBy)
      emit({ type: 'tugTowing', tick, tugId: by, shipId: ship.id });
    ship.towedBy = by;
  }
}

/** Rings a bell buoy when a ship sails into its circle of light. */
export function ringBuoys(
  ships: readonly Ship[],
  buoys: readonly BuoyLight[],
  tick: number,
  emit: Emit,
): void {
  for (const ship of ships) {
    let inside = -1;
    buoys.forEach((b, i) => {
      if (Math.hypot(ship.x - b.x, ship.y - b.y) < b.radius) inside = i;
    });
    if (inside !== -1 && inside !== ship.buoy) {
      emit({ type: 'buoyRang', tick, buoyIndex: inside, shipId: ship.id, x: ship.x, y: ship.y });
    }
    ship.buoy = inside;
  }
}
