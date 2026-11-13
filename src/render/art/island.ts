/**
 * The island and its lighthouse, drawn in world units around (0, 0). The ground lies flat on the
 * water; the tower and buildings stand upright (screen up = -y). Proportions follow the prototype.
 */
import { Container, Graphics } from 'pixi.js';
import type { IslandBuildingId } from '../../data/types';
import { createRng } from '../../sim/rng';
import { PALETTE } from '../palette';
import type { IslandArt, Point } from './types';

const IRON = 0x1f2422;
const WHITE_STRIPE = 0xe8e3d7;
const TOWER_BASE: Point = { x: -3, y: -2 };
const TOWER_HEIGHT = 62;
const BOTTOM_HALF = 9;
const TOP_HALF = 6;
const STRIPES = 5;
const LAMP_POINT: Point = { x: TOWER_BASE.x, y: TOWER_BASE.y - TOWER_HEIGHT - 6.5 };

/** A wobbly low-poly ellipse, the same every time for the same seed. */
function lumpy(seed: number, cx: number, cy: number, rx: number, ry: number, n: number): number[] {
  const rng = createRng(seed);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = rng.range(0.9, 1.05);
    out.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
  }
  return out;
}

function ground(radius: number): Container {
  const r = radius;
  const g = new Graphics({ label: 'ground' });
  g.poly(lumpy(11, 0, 6, r + 7, (r + 5) * 0.9, 18)).fill({ color: PALETTE.seaCrest, alpha: 0.22 });
  g.poly(lumpy(12, 0, 6, r, r * 0.88, 16)).fill(0x2b2925);
  g.poly(lumpy(13, 0, 3, r, r * 0.88, 16)).fill(0x3d3833);
  g.poly(lumpy(14, 0, 0, r, r * 0.88, 16)).fill(0x5b534a);
  g.poly(lumpy(15, -3, -2, r * 0.74, r * 0.6, 14)).fill(PALETTE.moss);
  g.poly(lumpy(16, -9, -7, r * 0.36, r * 0.26, 9)).fill(0x5d7d55);
  g.poly(lumpy(17, 8, 4, r * 0.3, r * 0.2, 9)).fill(0x587652);
  // A sandy path from the tower door down to the jetty.
  g.moveTo(TOWER_BASE.x + 2, TOWER_BASE.y + 1)
    .quadraticCurveTo(8, 10, r * 0.55, r * 0.45)
    .stroke({ color: 0x9c8a6a, width: 2.2, cap: 'round' });
  // The jetty: planks on posts, reaching into the water toward the south-east.
  const jetty = new Graphics({ label: 'jetty' })
    .rect(0, -2.6, 17, 5.2)
    .fill(0x8a6a45)
    .rect(0, -2.6, 17, 1)
    .fill(0xa4825a);
  for (let x = 2; x < 17; x += 4.5) {
    jetty.rect(x, 2.4, 1.1, 2).fill(0x4f3b26);
  }
  jetty.position.set(r * 0.55, r * 0.45);
  jetty.rotation = 0.6;
  const box = new Container({ label: 'islandGround' });
  box.addChild(g, jetty);
  return box;
}

function tower(): Container {
  const g = new Graphics({ label: 'tower' });
  const { x: bx, y: by } = TOWER_BASE;
  const th = TOWER_HEIGHT;
  const halfAt = (t: number): number => BOTTOM_HALF + (TOP_HALF - BOTTOM_HALF) * t;
  // Stripes from the bottom up, each a trapezoid.
  for (let i = 0; i < STRIPES; i++) {
    const t0 = i / STRIPES;
    const t1 = (i + 1) / STRIPES;
    const y0 = by - th * t0;
    const y1 = by - th * t1;
    const h0 = halfAt(t0);
    const h1 = halfAt(t1);
    g.poly([bx - h0, y0, bx + h0, y0, bx + h1, y1, bx - h1, y1]).fill(
      i % 2 ? PALETTE.rust : WHITE_STRIPE,
    );
  }
  // Round shading: the right side turns away from the viewer, a thin highlight on the left.
  g.poly([bx + 1, by, bx + BOTTOM_HALF, by, bx + TOP_HALF, by - th, bx + 0.6, by - th]).fill({
    color: 0x000000,
    alpha: 0.28,
  });
  g.poly([bx - 6.4, by, bx - 4.6, by, bx - 3, by - th, bx - 4.3, by - th]).fill({
    color: 0xffffff,
    alpha: 0.14,
  });
  // Door and two small windows.
  g.roundRect(bx - 1.8, by - 6, 3.6, 6, 1.6).fill(0x2a2520);
  g.rect(bx - 0.8, by - th * 0.42, 1.6, 2.8).fill(0x2a2520);
  g.rect(bx - 0.7, by - th * 0.74, 1.4, 2.4).fill(0x2a2520);
  // Gallery: the walkway plate and its railing.
  const gy = by - th;
  g.rect(bx - 9, gy - 2, 18, 3).fill(IRON);
  for (let x = -8.5; x <= 8.5; x += 2.4) g.rect(bx + x - 0.3, gy - 5.5, 0.6, 3.5).fill(IRON);
  g.rect(bx - 9, gy - 6, 18, 0.9).fill(IRON);
  // Lamp room: glass, its frame, and the roof.
  g.rect(bx - 5, gy - 11, 10, 9).fill(PALETTE.lampHot);
  for (const x of [-5, -1.8, 1.8, 4.4]) g.rect(bx + x, gy - 11, 0.6, 9).fill(IRON);
  g.rect(bx - 5.4, gy - 11.6, 10.8, 1).fill(IRON);
  g.poly([bx - 7, gy - 11, bx, gy - 18, bx + 7, gy - 11]).fill(IRON);
  g.circle(bx, gy - 18.6, 1).fill(IRON);
  return g;
}

function lampGlass(): Container {
  const gy = TOWER_BASE.y - TOWER_HEIGHT;
  return new Graphics({ label: 'lampGlass' })
    .rect(TOWER_BASE.x - 4.6, gy - 10.6, 9.2, 8.2)
    .fill(0xffffff);
}

/** Each building stands at its own spot; its container's y is its base (used for drawing order). */
const BUILDINGS: Record<IslandBuildingId, { at: Point; draw: (g: Graphics) => Graphics }> = {
  cottage: {
    at: { x: 14, y: 6 },
    draw: (g) =>
      g
        .rect(-6, -8, 12, 8)
        .fill(0xd8cdb8)
        .rect(1, -8, 5, 8)
        .fill({ color: 0x000000, alpha: 0.15 })
        .poly([-8, -8, 0, -14, 8, -8])
        .fill(0x7a3a2a)
        .rect(3, -15, 2, 4)
        .fill(0x5b534a)
        .rect(-2.5, -5.5, 3, 3)
        .fill(PALETTE.lamp)
        .rect(2, -4, 2.4, 4)
        .fill(0x4f3b26),
  },
  dock: {
    at: { x: -12, y: 28 },
    draw: (g) =>
      g
        .rect(-12, -2, 24, 12)
        .fill(0x7a5c3b)
        .rect(-12, -2, 24, 1.2)
        .fill(0xa4825a)
        .rect(-8, -6, 5, 5)
        .fill(0x9c7a4c)
        .rect(-5, -9, 4, 4)
        .fill(0xb08c5a)
        .rect(6, -11, 0.8, 11)
        .fill(IRON)
        .circle(-11, 8, 1.1)
        .fill(IRON)
        .circle(11, 8, 1.1)
        .fill(IRON),
  },
  chapel: {
    at: { x: -21, y: -3 },
    draw: (g) =>
      g
        .rect(-5, -9, 10, 9)
        .fill(0x9a9286)
        .rect(1, -9, 4, 9)
        .fill({ color: 0x000000, alpha: 0.18 })
        .poly([-6.5, -9, 0, -14, 6.5, -9])
        .fill(0x3c4048)
        .rect(-1.6, -21, 3.2, 8)
        .fill(0x9a9286)
        .poly([-2.4, -21, 0, -26, 2.4, -21])
        .fill(0x3c4048)
        .circle(0, -17.5, 0.9)
        .fill(0xc9a227)
        .circle(0, -5.6, 1.4)
        .fill(PALETTE.lamp)
        .roundRect(-1.2, -3, 2.4, 3, 1)
        .fill(0x2a2520),
  },
  market: {
    at: { x: 4, y: 20 },
    draw: (g) => {
      for (const [x, stripe] of [
        [-6, PALETTE.rust],
        [3, 0x3e6d7a],
      ] as const) {
        g.rect(x - 0.3, -6, 0.6, 6).fill(0x4f3b26);
        g.rect(x + 4.7, -6, 0.6, 6).fill(0x4f3b26);
        g.rect(x, -3, 5, 3).fill(0x8a6a45);
        for (let i = 0; i < 4; i++)
          g.rect(x - 0.5 + i * 1.5, -8, 1.5, 2).fill(i % 2 ? PALETTE.parchment : stripe);
      }
      return g;
    },
  },
  festivalLights: {
    at: { x: 0, y: 12 },
    draw: (g) => {
      for (const x of [-26, -2, 22]) g.rect(x - 0.4, -10, 0.8, 10).fill(0x4f3b26);
      return g
        .moveTo(-26, -10)
        .quadraticCurveTo(-14, -4, -2, -10)
        .quadraticCurveTo(10, -4, 22, -10)
        .stroke({ color: 0x2a2520, width: 0.4 });
    },
  },
};

const FESTIVAL_COLORS = [0xff7a5c, PALETTE.lamp, 0x7fd6c8, 0xc59bff];

/** Points along the festival string (two sagging curves), in the building's own frame. */
function festivalBulbs(): (Point & { color: number })[] {
  const bulbs: (Point & { color: number })[] = [];
  const spans: [number, number][] = [
    [-26, -2],
    [-2, 22],
  ];
  let n = 0;
  for (const [x0, x1] of spans) {
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const x = x0 + (x1 - x0) * t;
      // Quadratic sag matching the drawn curve (control point 6 units lower).
      const y = -10 + 2 * t * (1 - t) * 6;
      bulbs.push({
        x,
        y: y + 0.6,
        color: FESTIVAL_COLORS[n++ % FESTIVAL_COLORS.length] ?? PALETTE.lamp,
      });
    }
  }
  return bulbs;
}

const LIGHTS: Record<IslandBuildingId, readonly (Point & { color: number })[]> = {
  cottage: [{ x: -1, y: -4, color: PALETTE.lamp }],
  dock: [{ x: 6.4, y: -11, color: PALETTE.lamp }],
  chapel: [{ x: 0, y: -5.6, color: PALETTE.lamp }],
  market: [
    { x: -3.5, y: -5, color: PALETTE.lamp },
    { x: 5.5, y: -5, color: PALETTE.lamp },
  ],
  festivalLights: festivalBulbs(),
};

/** A small rocky islet with a tuft of grass (no jetty). */
function islet(radius: number): Container {
  const r = radius;
  const g = new Graphics({ label: 'islet' });
  g.poly(lumpy(21, 0, 3, r + 4, (r + 3) * 0.9, 12)).fill({ color: PALETTE.seaCrest, alpha: 0.22 });
  g.poly(lumpy(22, 0, 3, r, r * 0.85, 11)).fill(0x2b2925);
  g.poly(lumpy(23, 0, 1, r, r * 0.85, 11)).fill(0x4a453f);
  g.poly(lumpy(24, -1, -1, r * 0.6, r * 0.45, 9)).fill(PALETTE.moss);
  return g;
}

export function createIslandArt(): IslandArt {
  return {
    createIslet: islet,
    secondTowerScale: 0.62,
    createGround: ground,
    createTower: tower,
    createLampGlass: lampGlass,
    lampPoint: LAMP_POINT,
    towerBase: TOWER_BASE,
    towerHeight: TOWER_HEIGHT,
    createBuilding(id) {
      const { at, draw } = BUILDINGS[id];
      const g = draw(new Graphics({ label: id }));
      g.position.set(at.x, at.y);
      return g;
    },
    buildingLights(id) {
      const { at } = BUILDINGS[id];
      return LIGHTS[id].map((p) => ({ x: p.x + at.x, y: p.y + at.y, color: p.color }));
    },
  };
}
