/** Debug drawing, shown only with ?debug in the URL: the 230-unit safe circle that must stay on screen. */
import { Graphics } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import type { ViewportConfig } from '../data/types';

export function createSafeRing(): Graphics {
  return new Graphics({ label: 'safeRing' });
}

export function drawSafeRing(g: Graphics, vp: Viewport, config: ViewportConfig): void {
  const pixel = 1 / vp.scale;
  g.clear()
    .circle(0, 0, config.safeRadius)
    .stroke({ color: 0xff5e5e, width: 1.5 * pixel, alpha: 0.9 })
    .moveTo(-8, 0)
    .lineTo(8, 0)
    .moveTo(0, -8)
    .lineTo(0, 8)
    .stroke({ color: 0xff5e5e, width: pixel, alpha: 0.9 });
}
