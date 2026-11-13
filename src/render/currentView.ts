/**
 * The sea current's arrow, drawn once per night (and on resize) in the corner of the play area,
 * pointing the way the water drifts. Nothing is drawn on a night without a current.
 */
import { Graphics, type Container } from 'pixi.js';
import type { World } from '../sim/world';
import { PALETTE } from './palette';

export interface CurrentView {
  /** Redraws for this night at this scale (CSS px per world unit). */
  draw(night: World | null, scale: number): void;
  destroy(): void;
}

export function createCurrentView(layer: Container): CurrentView {
  const g = new Graphics({ label: 'current' });
  layer.addChild(g);
  return {
    draw(night, scale) {
      g.clear();
      if (!night) return;
      const { currentX, currentY } = night.setup.ships;
      const strength = Math.hypot(currentX, currentY);
      if (strength <= 0) return;
      const ux = currentX / strength;
      const uy = currentY / strength;
      const length = 14 + strength * 4;
      const x0 = -150 - (ux * length) / 2;
      const y0 = -150 - (uy * length) / 2;
      const x1 = x0 + ux * length;
      const y1 = y0 + uy * length;
      g.moveTo(x0, y0)
        .lineTo(x1, y1)
        .moveTo(x1 - ux * 6 - uy * 4, y1 - uy * 6 + ux * 4)
        .lineTo(x1, y1)
        .lineTo(x1 - ux * 6 + uy * 4, y1 - uy * 6 - ux * 4)
        .stroke({ color: PALETTE.seaCrest, width: 1.5 / scale, alpha: 0.4, cap: 'round' });
    },
    destroy() {
      g.destroy();
    },
  };
}
