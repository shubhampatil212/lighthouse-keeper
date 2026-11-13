/** Code-drawn rocks (shaded side face, faceted top face) and bell buoys. */
import { Container, Graphics } from 'pixi.js';
import { mixColor, PALETTE } from '../palette';
import { facetLight, rockShape } from './rockShape';
import type { Point, ReefArt, RockShape } from './types';

const SIDE = 0x1e1d1b;
const DARK_FACE = 0x2e2b27;
const LIGHT_FACE = 0x8f877a;
/** How far the top face sits above the water (world units). */
const TOP_LIFT = 1.6;
const SIDE_DROP = 2.2;

const ICE_SIDE = 0x2f6a8c;
const ICE_DARK_FACE = 0x8fbfd6;
const ICE_LIGHT_FACE = 0xf1fbff;
/** The ice-blue edge an iceberg shows when the light is on it. */
export const ICE_EDGE = 0x9fe6ff;
/** Icebergs stand taller out of the water than rocks. */
const ICE_LIFT = 3.2;
const ICE_DROP = 3;

const flat = (points: readonly Point[], dx: number, dy: number): number[] =>
  points.flatMap((p) => [p.x + dx, p.y + dy]);

export function createReefArt(): ReefArt {
  return {
    rockShape,
    createRock(shape: RockShape, lightFrom: Point) {
      const g = new Graphics();
      g.poly(flat(shape.points, 0, SIDE_DROP)).fill(SIDE);
      g.poly(flat(shape.points, 0, -TOP_LIFT)).fill(PALETTE.stone);
      const { points, peak } = shape;
      const top = { x: peak.x, y: peak.y - TOP_LIFT };
      points.forEach((a, i) => {
        const b = points[(i + 1) % points.length] ?? a;
        const shade = facetLight(peak, a, b, lightFrom);
        g.poly([top.x, top.y, a.x, a.y - TOP_LIFT, b.x, b.y - TOP_LIFT]).fill(
          mixColor(DARK_FACE, LIGHT_FACE, shade),
        );
      });
      return g;
    },
    createIceberg(shape: RockShape, lightFrom: Point) {
      const g = new Graphics();
      const { points, peak } = shape;
      g.poly(flat(points, 0, ICE_DROP)).fill(ICE_SIDE);
      g.poly(flat(points, 0, -ICE_LIFT)).fill(0xcfe9f4);
      const top = { x: peak.x, y: peak.y - ICE_LIFT * 1.6 };
      points.forEach((a, i) => {
        const b = points[(i + 1) % points.length] ?? a;
        const shade = facetLight(peak, a, b, lightFrom);
        g.poly([top.x, top.y, a.x, a.y - ICE_LIFT, b.x, b.y - ICE_LIFT]).fill(
          mixColor(ICE_DARK_FACE, ICE_LIGHT_FACE, shade),
        );
      });
      g.poly(flat(points, 0, -ICE_LIFT)).stroke({ color: ICE_EDGE, width: 1.2, alpha: 0.9 });
      return g;
    },
    createBuoy() {
      const body = new Container();
      body.addChild(
        new Graphics()
          .ellipse(0, 0.5, 4.5, 1.6)
          .fill({ color: 0x000000, alpha: 0.3 })
          .poly([-4, 0, 0, -10, 4, 0])
          .fill(PALETTE.rust)
          .poly([-2.6, -3.5, 2.6, -3.5, 1.8, -5.5, -1.8, -5.5])
          .fill(PALETTE.parchment)
          .rect(-0.5, -12, 1, 2)
          .fill(0x1f2422),
      );
      return { body, lightHeight: 11 };
    },
  };
}
