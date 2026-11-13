/** Shared pieces for code-drawn vessels: hull outlines, the hull's shadow, masts and funnels. */
import { GraphicsContext } from 'pixi.js';

export const MAST = 0x2a2520;
export const SAIL = 0xe6dfcf;
export const SHADOW = { color: 0x000000, alpha: 0.32 };

export type Outline = (g: GraphicsContext, l: number, w: number) => GraphicsContext;

export const pointed: Outline = (g, l, w) =>
  g
    .moveTo(l * 0.55, 0)
    .quadraticCurveTo(l * 0.1, -w * 0.6, -l * 0.45, -w * 0.45)
    .lineTo(-l * 0.45, w * 0.45)
    .quadraticCurveTo(l * 0.1, w * 0.6, l * 0.55, 0)
    .closePath();

export const boxy: Outline = (g, l, w) =>
  g
    .moveTo(l * 0.5, 0)
    .lineTo(l * 0.3, -w * 0.5)
    .lineTo(-l * 0.5, -w * 0.46)
    .lineTo(-l * 0.5, w * 0.46)
    .lineTo(l * 0.3, w * 0.5)
    .closePath();

export const stubby: Outline = (g, l, w) =>
  g
    .moveTo(l * 0.5, 0)
    .quadraticCurveTo(l * 0.48, -w * 0.5, l * 0.1, -w * 0.5)
    .lineTo(-l * 0.36, -w * 0.5)
    .quadraticCurveTo(-l * 0.5, -w * 0.5, -l * 0.5, 0)
    .quadraticCurveTo(-l * 0.5, w * 0.5, -l * 0.36, w * 0.5)
    .lineTo(l * 0.1, w * 0.5)
    .quadraticCurveTo(l * 0.48, w * 0.5, l * 0.5, 0)
    .closePath();

/** A shadow just larger than the hull, so ships sit in the water rather than on it. */
export function hullBase(outline: Outline, l: number, w: number, color: number): GraphicsContext {
  const g = new GraphicsContext();
  outline(g, l * 1.12, w * 1.25).fill(SHADOW);
  outline(g, l, w).fill(color);
  return g;
}

/** A mast from the deck up, `h` tall. */
export const mast = (g: GraphicsContext, x: number, h: number, width = 1.1): GraphicsContext =>
  g.rect(x - width / 2, -h, width, h).fill(MAST);

/** A funnel standing on the deck, with a colored band. */
export const funnel = (
  g: GraphicsContext,
  x: number,
  h: number,
  w: number,
  band: number,
): GraphicsContext =>
  g
    .rect(x - w / 2, -h, w, h)
    .fill(0x2a2520)
    .rect(x - w / 2, -h + 1, w, Math.max(1, h * 0.22))
    .fill(band);
