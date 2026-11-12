/** A small developer readout shown with ?debug in the URL: scale, size, pixel ratio and frame rate. */
import type { Viewport } from '../app/viewport';

export interface DebugOverlay {
  setViewport(vp: Viewport): void;
  frame(now: number): void;
  setRenderer(name: string): void;
}

export function createDebugOverlay(parent: HTMLElement): DebugOverlay {
  const el = document.createElement('pre');
  el.className = 'debug-overlay';
  parent.appendChild(el);
  let vpText = '';
  let renderer = '';
  let frames = 0;
  let since = 0;
  let fps = 0;

  const paint = (): void => {
    el.textContent = `${renderer}  ${fps} fps\n${vpText}`;
  };

  return {
    setViewport(vp) {
      const i = vp.insets;
      vpText =
        `${vp.width}×${vp.height} css px  @${vp.resolution}x\n` +
        `S = ${vp.scale.toFixed(3)} px/wu  island at ${Math.round(vp.centerX)},${Math.round(vp.centerY)}\n` +
        `safe insets ${i.top} ${i.right} ${i.bottom} ${i.left}`;
      paint();
    },
    frame(now) {
      frames++;
      if (now - since >= 1000) {
        fps = Math.round((frames * 1000) / (now - since));
        frames = 0;
        since = now;
        paint();
      }
    },
    setRenderer(name) {
      renderer = name;
      paint();
    },
  };
}
