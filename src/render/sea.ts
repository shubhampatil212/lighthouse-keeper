/** Placeholder water: a vertical gradient from deep to mid sea, filling the screen (phase 03 replaces it). */
import { FillGradient, Graphics } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import { PALETTE } from './palette';

export function createSea(): Graphics {
  return new Graphics({ label: 'sea' });
}

export function drawSea(g: Graphics, vp: Viewport): void {
  const gradient = new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
      { offset: 0, color: PALETTE.seaDeep },
      { offset: 1, color: PALETTE.sea },
    ],
    textureSpace: 'local',
  });
  g.clear().rect(0, 0, vp.width, vp.height).fill(gradient);
}
