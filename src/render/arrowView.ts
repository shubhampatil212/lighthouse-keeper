/**
 * Arrows at the screen edge pointing at ships the player can't see yet: ships already sailing beyond
 * the screen's edge (common on narrow phones), and ships due to appear in the next couple of seconds.
 * They glow in lantern amber because a lantern is what the player will look for.
 */
import { Graphics, type Container } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import type { RenderFeelConfig } from '../data/types';
import type { Point } from './art/types';
import { edgeArrow } from './edgeArrow';
import { PALETTE } from './palette';

export interface ArrowView {
  /** `sailing` are ship positions; `due` are spawn points with seconds until the ship appears. */
  draw(
    vp: Viewport,
    sailing: readonly Point[],
    due: readonly (Point & { inSeconds: number })[],
    time: number,
  ): void;
  /** Keeps arrows clear of the HUD's top and bottom bars (CSS px). */
  setHudInsets(top: number, bottom: number): void;
  destroy(): void;
}

/** A ship counts as seen once its lantern is this far inside the screen edge (CSS px). */
const VISIBLE_MARGIN = 6;

export function createArrowView(layer: Container, feel: RenderFeelConfig): ArrowView {
  const g = new Graphics({ label: 'edgeArrows' });
  layer.addChild(g);
  let hudTop = 0;
  let hudBottom = 0;

  const arrow = (vp: Viewport, target: Point, alpha: number): void => {
    const sx = vp.centerX + target.x * vp.scale;
    const sy = vp.centerY + target.y * vp.scale;
    const a = edgeArrow(
      vp.width,
      vp.height,
      vp.centerX,
      vp.centerY,
      sx,
      sy,
      feel.arrowInset,
      VISIBLE_MARGIN,
      {
        top: vp.insets.top + hudTop,
        right: vp.insets.right,
        bottom: vp.insets.bottom + hudBottom,
        left: vp.insets.left,
      },
    );
    if (!a) return;
    const s = 1 / vp.scale;
    const x = (a.x - vp.centerX) * s;
    const y = (a.y - vp.centerY) * s;
    const size = feel.arrowSize * s;
    const c = Math.cos(a.angle);
    const n = Math.sin(a.angle);
    const tip = { x: x + c * size, y: y + n * size };
    const back = { x: x - c * size * 0.4, y: y - n * size * 0.4 };
    g.poly([
      tip.x,
      tip.y,
      back.x - n * size * 0.7,
      back.y + c * size * 0.7,
      x,
      y,
      back.x + n * size * 0.7,
      back.y - c * size * 0.7,
    ]).fill({ color: PALETTE.lamp, alpha });
    g.circle(x - c * size * 0.9, y - n * size * 0.9, size * 0.28).fill({
      color: PALETTE.lampHot,
      alpha,
    });
  };

  return {
    draw(vp, sailing, due, time) {
      g.clear();
      for (const p of sailing) arrow(vp, p, 0.85);
      const pulse = 0.5 + Math.sin(time * 6) * 0.25;
      for (const p of due) {
        const ramp = 1 - Math.max(0, Math.min(1, p.inSeconds / feel.arrowLookAhead));
        arrow(vp, p, pulse * (0.3 + 0.7 * ramp));
      }
    },
    setHudInsets(top, bottom) {
      hudTop = top;
      hudBottom = bottom;
    },
    destroy() {
      g.destroy();
    },
  };
}
