/**
 * Screen layout math: where the island sits on screen and how many pixels one world unit covers (S).
 * Pure functions only, so they can be unit-tested without a browser.
 */
import type { ViewportConfig } from '../data/types';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const NO_INSETS: Readonly<Insets> = { top: 0, right: 0, bottom: 0, left: 0 };

export interface ViewportInput {
  /** Window size in CSS pixels. */
  width: number;
  height: number;
  /** Safe-area insets (notch, home bar) in CSS pixels. */
  insets: Insets;
  devicePixelRatio: number;
  /** Cap from the current quality level. */
  maxPixelRatio: number;
}

export interface Viewport {
  width: number;
  height: number;
  insets: Insets;
  /** Screen pixels per world unit. */
  scale: number;
  /** Screen position of the island, world (0, 0), in CSS pixels. */
  centerX: number;
  centerY: number;
  /** Renderer resolution (device pixels per CSS pixel). */
  resolution: number;
}

export function computeViewport(input: ViewportInput, config: ViewportConfig): Viewport {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const { insets } = input;
  const safeWidth = Math.max(1, width - insets.left - insets.right);
  const safeHeight = Math.max(1, height - insets.top - insets.bottom);
  const neededWorldUnits = 2 * config.safeRadius * (1 + config.edgeMargin);
  const dpr = input.devicePixelRatio > 0 ? input.devicePixelRatio : 1;

  return {
    width,
    height,
    insets: { ...insets },
    scale: Math.min(safeWidth, safeHeight) / neededWorldUnits,
    centerX: insets.left + safeWidth / 2,
    centerY: insets.top + safeHeight / 2,
    resolution: Math.min(dpr, input.maxPixelRatio),
  };
}

export function worldToScreen(vp: Viewport, x: number, y: number): { x: number; y: number } {
  return { x: vp.centerX + x * vp.scale, y: vp.centerY + y * vp.scale };
}

export function screenToWorld(vp: Viewport, x: number, y: number): { x: number; y: number } {
  return { x: (x - vp.centerX) / vp.scale, y: (y - vp.centerY) / vp.scale };
}
