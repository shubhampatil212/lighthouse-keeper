/**
 * Debug "Reveal all": outlines hidden rocks and dark vessels (ships and pirates) in red. Drawing only; the simulation never
 * knows, so debugging can't change what happens.
 */
import { Graphics, type Container } from 'pixi.js';
import type { World } from '../../sim/world';
import type { VesselKind } from '../art/types';
import type { ShipPose } from '../shipView';

const HIDDEN = 0xff7a7a;

export interface RevealOverlay {
  draw(world: World | null, ships: readonly ShipPose[], on: boolean, pixel: number): void;
  destroy(): void;
}

export function createRevealOverlay(
  layer: Container,
  types: Record<VesselKind, { length: number; width: number }>,
): RevealOverlay {
  const g = new Graphics({ label: 'revealAll' });
  layer.addChild(g);
  return {
    draw(world, ships, on, pixel) {
      g.clear();
      if (!on || !world) return;
      for (const rock of world.state.rocks) {
        if (!rock.lit)
          g.circle(rock.x, rock.y, rock.r).stroke({ color: HIDDEN, width: pixel, alpha: 0.7 });
      }
      for (const ship of ships) {
        if (ship.lit) continue;
        const { length, width } = types[ship.type];
        const c = Math.cos(ship.heading);
        const s = Math.sin(ship.heading);
        const pts: [number, number][] = [
          [length / 2, 0],
          [-length / 2, width / 2],
          [-length / 2, -width / 2],
        ];
        g.poly(pts.flatMap(([x, y]) => [ship.x + x * c - y * s, ship.y + x * s + y * c])).stroke({
          color: HIDDEN,
          width: pixel,
          alpha: 0.8,
        });
      }
    },
    destroy() {
      g.destroy();
    },
  };
}
