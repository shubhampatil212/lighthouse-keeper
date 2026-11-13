/**
 * Code-drawn ships. Each type has its own hull outline and deck (flat on the water, bow along +x) and
 * its own upright rig (mast, sails, funnels, cabins), so the six types can be told apart at a glance:
 * fishing boat (teal, small sail), cargo ship (rust, containers, funnel), sailboat (white, tall sails),
 * ferry (cream and navy, long cabin, two funnels, gold lantern), tugboat (stubby, black and red,
 * fenders), smuggler (low, dark, patched sail, dim lantern).
 * Drawings are shared between ships of the same type (one GraphicsContext each).
 */
import { Graphics, GraphicsContext } from 'pixi.js';
import type { ShipTypeId } from '../../data/types';
import { PALETTE } from '../palette';
import type { ShipArt, ShipLanternArt } from './types';

const MAST = 0x2a2520;
const SAIL = 0xe6dfcf;
const SHADOW = { color: 0x000000, alpha: 0.32 };

type Outline = (g: GraphicsContext, l: number, w: number) => GraphicsContext;

const pointed: Outline = (g, l, w) =>
  g
    .moveTo(l * 0.55, 0)
    .quadraticCurveTo(l * 0.1, -w * 0.6, -l * 0.45, -w * 0.45)
    .lineTo(-l * 0.45, w * 0.45)
    .quadraticCurveTo(l * 0.1, w * 0.6, l * 0.55, 0)
    .closePath();

const boxy: Outline = (g, l, w) =>
  g
    .moveTo(l * 0.5, 0)
    .lineTo(l * 0.3, -w * 0.5)
    .lineTo(-l * 0.5, -w * 0.46)
    .lineTo(-l * 0.5, w * 0.46)
    .lineTo(l * 0.3, w * 0.5)
    .closePath();

const stubby: Outline = (g, l, w) =>
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
function hullBase(outline: Outline, l: number, w: number, color: number): GraphicsContext {
  const g = new GraphicsContext();
  outline(g, l * 1.12, w * 1.25).fill(SHADOW);
  outline(g, l, w).fill(color);
  return g;
}

const HULLS: Record<ShipTypeId, (l: number, w: number) => GraphicsContext> = {
  fishing: (l, w) =>
    hullBase(pointed, l, w, 0x2f5d6b)
      .rect(-l * 0.3, -w * 0.25, l * 0.5, w * 0.5)
      .fill(0xc9b48a)
      .rect(-l * 0.4, -w * 0.28, l * 0.16, w * 0.56)
      .fill(0xd8cdb8)
      .circle(l * 0.14, 0, w * 0.16)
      .fill(0x6b5a40),
  cargo: (l, w) => {
    const g = hullBase(boxy, l, w, 0x6e3526)
      .rect(-l * 0.44, -w * 0.36, l * 0.7, w * 0.72)
      .fill(0x4f2a20);
    const colors = [0xc9a227, 0x3e6d7a, 0xa8462e];
    colors.forEach((color, i) => {
      g.rect(-l * 0.24 + i * l * 0.17, -w * 0.3, l * 0.14, w * 0.6).fill(color);
    });
    return g.rect(-l * 0.44, -w * 0.32, l * 0.13, w * 0.64).fill(0xe0d6c0);
  },
  sailboat: (l, w) =>
    hullBase(pointed, l, w, 0xe6dfcf)
      .moveTo(l * 0.4, 0)
      .lineTo(l * 0.05, -w * 0.32)
      .lineTo(-l * 0.38, -w * 0.3)
      .lineTo(-l * 0.38, w * 0.3)
      .lineTo(l * 0.05, w * 0.32)
      .closePath()
      .fill(0xa4825a)
      .rect(-l * 0.36, -w * 0.18, l * 0.18, w * 0.36)
      .fill(0x7d6243),
  ferry: (l, w) => {
    const g = new GraphicsContext();
    boxy(g, l * 1.1, w * 1.25).fill(SHADOW);
    boxy(g, l, w).fill(0x1f3d5c);
    boxy(g, l * 0.92, w * 0.8).fill(0xece6d6);
    g.rect(-l * 0.36, -w * 0.28, l * 0.62, w * 0.56).fill(0xd9d2c0);
    for (let i = 0; i < 6; i++)
      g.rect(-l * 0.32 + i * l * 0.1, -w * 0.06, l * 0.05, w * 0.12).fill(PALETTE.lamp);
    return g;
  },
  tugboat: (l, w) => {
    const g = new GraphicsContext();
    stubby(g, l * 1.12, w * 1.22).fill(SHADOW);
    stubby(g, l * 1.06, w * 1.12).fill(0x151515);
    stubby(g, l, w).fill(0x2b2b2b);
    stubby(g, l * 0.78, w * 0.7).fill(PALETTE.rust);
    return g.rect(-l * 0.08, -w * 0.24, l * 0.32, w * 0.48).fill(0xe8e3d7);
  },
  smuggler: (l, w) =>
    hullBase(pointed, l, w, 0x1d1f24)
      .rect(-l * 0.32, -w * 0.22, l * 0.56, w * 0.44)
      .fill(0x3a3c40)
      .roundRect(-l * 0.2, -w * 0.18, l * 0.18, w * 0.36, 1)
      .fill(0x4b4a3c)
      .roundRect(l * 0.02, -w * 0.16, l * 0.14, w * 0.32, 1)
      .fill(0x4b4a3c),
};

/** A mast from the deck up, `h` tall. */
const mast = (g: GraphicsContext, x: number, h: number, width = 1.1): GraphicsContext =>
  g.rect(x - width / 2, -h, width, h).fill(MAST);

/** A funnel standing on the deck, with a colored band. */
const funnel = (
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

const RIGS: Record<ShipTypeId, (l: number, w: number) => GraphicsContext> = {
  fishing: (l) =>
    mast(new GraphicsContext(), 0, 13)
      .moveTo(1, -12)
      .lineTo(1, -2)
      .lineTo(l * 0.55, -2)
      .closePath()
      .fill(SAIL)
      .moveTo(-l * 0.38, -1)
      .lineTo(-1, -9)
      .stroke({ color: MAST, width: 0.6 }),
  cargo: (l) => {
    const g = mast(new GraphicsContext(), l * 0.12, 16, 1.2)
      .rect(l * 0.12 - 2.5, -13, 5, 0.9)
      .fill(MAST);
    // The bridge at the stern, then its funnel.
    g.rect(-l * 0.46, -6, l * 0.16, 6).fill(0xe0d6c0);
    g.rect(-l * 0.44, -4.6, l * 0.12, 1.2).fill(0x3c3a36);
    return funnel(g, -l * 0.36, 11, 3.4, PALETTE.rust);
  },
  sailboat: (l) =>
    mast(new GraphicsContext(), 0, 21, 0.9)
      .moveTo(0.8, -20)
      .lineTo(0.8, -2)
      .lineTo(-l * 0.5, -2)
      .closePath()
      .fill(0xf3eee2)
      .moveTo(0.2, -18)
      .lineTo(l * 0.52, -1.5)
      .lineTo(1.2, -1.5)
      .closePath()
      .fill(0xd9d2c0),
  ferry: (l) => {
    const g = new GraphicsContext()
      .rect(-l * 0.38, -6, l * 0.66, 6)
      .fill(0xece6d6)
      .rect(-l * 0.38, -6, l * 0.66, 1)
      .fill(0x1f3d5c);
    for (let i = 0; i < 7; i++)
      g.rect(-l * 0.35 + i * l * 0.09, -4, l * 0.05, 1.8).fill(PALETTE.lamp);
    funnel(g, -l * 0.18, 12, 3, 0x1f3d5c);
    funnel(g, l * 0.02, 12, 3, 0x1f3d5c);
    return mast(g, l * 0.34, 15, 0.9);
  },
  tugboat: (l) => {
    const g = new GraphicsContext()
      .rect(-l * 0.05, -6.5, l * 0.4, 6.5)
      .fill(0xe8e3d7)
      .rect(-l * 0.05, -5.2, l * 0.4, 1.6)
      .fill(0x22303a);
    funnel(g, -l * 0.24, 10, 3.6, PALETTE.rust);
    return mast(g, l * 0.2, 12, 0.9);
  },
  smuggler: (l) =>
    mast(new GraphicsContext(), -l * 0.04, 10, 0.9)
      .moveTo(-l * 0.04 + 0.6, -9.5)
      .lineTo(-l * 0.04 + 0.6, -1.5)
      .lineTo(l * 0.42, -2.5)
      .closePath()
      .fill(0x55524a)
      .rect(l * 0.08, -6, 2.4, 2)
      .fill(0x6b6656),
};

const LANTERNS: Record<ShipTypeId, ShipLanternArt> = {
  fishing: { along: 0, height: 13, color: PALETTE.lamp, glowScale: 1, brightness: 1 },
  cargo: { along: 0.12, height: 16, color: PALETTE.lamp, glowScale: 1.05, brightness: 1 },
  sailboat: { along: 0, height: 21, color: PALETTE.lamp, glowScale: 0.9, brightness: 1 },
  ferry: { along: 0.34, height: 15, color: 0xffd23a, glowScale: 1.5, brightness: 1.25 },
  tugboat: { along: 0.2, height: 12, color: PALETTE.lamp, glowScale: 1, brightness: 1 },
  smuggler: { along: -0.04, height: 10, color: 0xe08a5a, glowScale: 0.8, brightness: 0.55 },
};

export function createShipArt(): ShipArt & { destroy(): void } {
  const cache = new Map<string, GraphicsContext>();
  const shared = (key: string, build: () => GraphicsContext): GraphicsContext => {
    let context = cache.get(key);
    if (!context) {
      context = build();
      cache.set(key, context);
    }
    return context;
  };
  return {
    createHull(type, length, width) {
      return new Graphics(
        shared(`hull:${type}:${length}:${width}`, () => HULLS[type](length, width)),
      );
    },
    createRig(type, length, width) {
      return new Graphics(
        shared(`rig:${type}:${length}:${width}`, () => RIGS[type](length, width)),
      );
    },
    lantern(type) {
      return LANTERNS[type];
    },
    destroy() {
      for (const context of cache.values()) context.destroy();
      cache.clear();
    },
  };
}
