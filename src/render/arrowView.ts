/**
 * Arrows at the screen edge pointing at ships the player can't see yet: ships already sailing beyond
 * the screen's edge (common on narrow phones), and ships due to appear in the next couple of seconds.
 * They glow in lantern amber because a lantern is what the player will look for.
 */
import { Graphics, type Container } from 'pixi.js';
import type { Viewport } from '../app/viewport';
import { SEA } from '../data';
import type { RenderFeelConfig } from '../data/types';
import type { World } from '../sim/world';
import type { Point } from './art/types';
import { edgeArrow } from './edgeArrow';
import { PALETTE } from './palette';

/** Something to point at: a vessel (ships only get arrows) with its kind. */
export interface ArrowTarget extends Point {
  type: string;
}

export interface ArrowView {
  /**
   * Points at ships in `sailing` whose type is in `shipTypes`, and at spawn points of ships due within
   * the look-ahead.
   */
  draw(
    vp: Viewport,
    world: World,
    sailing: readonly ArrowTarget[],
    shipTypes: Readonly<Record<string, unknown>>,
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
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const due: Point = { x: 0, y: 0 };

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
      insets,
    );
    if (!a) return;
    const s = 1 / vp.scale;
    const x = (a.x - vp.centerX) * s;
    const y = (a.y - vp.centerY) * s;
    const size = feel.arrowSize * s;
    const c = Math.cos(a.angle);
    const n = Math.sin(a.angle);
    const backX = x - c * size * 0.4;
    const backY = y - n * size * 0.4;
    g.moveTo(x + c * size, y + n * size)
      .lineTo(backX - n * size * 0.7, backY + c * size * 0.7)
      .lineTo(x, y)
      .lineTo(backX + n * size * 0.7, backY - c * size * 0.7)
      .closePath()
      .fill({ color: PALETTE.lamp, alpha });
    g.circle(x - c * size * 0.9, y - n * size * 0.9, size * 0.28).fill({
      color: PALETTE.lampHot,
      alpha,
    });
  };

  return {
    draw(vp, world, sailing, shipTypes, time) {
      g.clear();
      insets.top = vp.insets.top + hudTop;
      insets.right = vp.insets.right;
      insets.bottom = vp.insets.bottom + hudBottom;
      insets.left = vp.insets.left;
      for (const p of sailing) if (p.type in shipTypes) arrow(vp, p, 0.85);
      const { state, setup } = world;
      if (state.status !== 'playing') return;
      const pulse = 0.5 + Math.sin(time * 6) * 0.25;
      for (let i = state.spawnIndex; i < setup.spawns.length; i++) {
        const order = setup.spawns[i];
        if (!order) continue;
        const inSeconds = order.at - state.time;
        if (inSeconds > feel.arrowLookAhead) break;
        due.x = Math.cos(order.angle) * SEA.spawnRadius;
        due.y = Math.sin(order.angle) * SEA.spawnRadius;
        const ramp = 1 - Math.max(0, Math.min(1, inSeconds / feel.arrowLookAhead));
        arrow(vp, due, pulse * (0.3 + 0.7 * ramp));
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
