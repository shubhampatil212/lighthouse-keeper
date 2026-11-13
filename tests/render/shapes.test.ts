import { describe, expect, it } from 'vitest';
import { facetLight, rockSeed, rockShape } from '../../src/render/art/rockShape';
import { dashOutline } from '../../src/render/dash';
import { edgeArrow } from '../../src/render/edgeArrow';
import { approach, lerpPose } from '../../src/render/interpolate';
import { shakeOffset } from '../../src/render/shake';

const square = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe('reef shapes', () => {
  it('gives the same rock for the same seed, every time', () => {
    expect(rockShape(1234, 9)).toEqual(rockShape(1234, 9));
    expect(rockShape(1234, 9)).not.toEqual(rockShape(1235, 9));
  });

  it('keeps every point near the rock radius, with 6 to 8 corners', () => {
    for (let seed = 0; seed < 50; seed++) {
      const shape = rockShape(seed, 10);
      expect(shape.points.length).toBeGreaterThanOrEqual(6);
      expect(shape.points.length).toBeLessThanOrEqual(8);
      for (const p of shape.points) expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(10.8 + 1e-9);
    }
  });

  it('gives each rock of a level its own seed', () => {
    const seeds = new Set(Array.from({ length: 20 }, (_, i) => rockSeed(1002, i)));
    expect(seeds.size).toBe(20);
  });

  it('lights facets facing the light more than facets facing away', () => {
    const peak = { x: 0, y: 0 };
    const toward = facetLight(peak, { x: 5, y: -1 }, { x: 5, y: 1 }, { x: 1, y: 0 });
    const away = facetLight(peak, { x: -5, y: -1 }, { x: -5, y: 1 }, { x: 1, y: 0 });
    expect(toward).toBeGreaterThan(away);
  });
});

describe('dashed outlines', () => {
  it('covers half of the outline with equal dash and gap', () => {
    const dashes = dashOutline(square, 2, 2);
    const drawn = dashes.reduce((sum, [x0, y0, x1, y1]) => sum + Math.hypot(x1 - x0, y1 - y0), 0);
    expect(drawn).toBeCloseTo(20, 6);
  });

  it('keeps the rhythm across corners', () => {
    const dashes = dashOutline(square, 3, 3);
    // The first edge ends mid-dash (3 + 3 + 3 = 9, then 1 more): the dash carries on round the corner.
    expect(dashes.slice(0, 3).map((d) => d.map((v) => Math.round(v * 100) / 100))).toEqual([
      [0, 0, 3, 0],
      [6, 0, 9, 0],
      [10, 2, 10, 5],
    ]);
  });

  it('returns nothing for empty outlines or zero dashes', () => {
    expect(dashOutline([], 2, 2)).toEqual([]);
    expect(dashOutline(square, 0, 2)).toEqual([]);
  });
});

describe('edge arrows', () => {
  it('shows no arrow for a ship on screen', () => {
    expect(edgeArrow(400, 800, 200, 400, 300, 300, 20, 6)).toBeNull();
  });

  it('pins the arrow inside the edge, pointing at an off-screen ship', () => {
    const a = edgeArrow(400, 800, 200, 400, 700, 400, 20, 6);
    expect(a).not.toBeNull();
    expect(a?.x).toBeCloseTo(380);
    expect(a?.y).toBeCloseTo(400);
    expect(a?.angle).toBeCloseTo(0);
  });

  it('uses whichever edge the line from the island crosses first', () => {
    // Mostly up: crosses the top edge (y = 20) before the left one.
    const up = edgeArrow(400, 800, 200, 400, -200, -1600, 20, 6);
    expect(up?.y).toBeCloseTo(20);
    expect(up?.x).toBeCloseTo(124);
    // Mostly left: crosses the left edge (x = 20) first.
    const left = edgeArrow(400, 800, 200, 400, -600, -1200, 20, 6);
    expect(left?.x).toBeCloseTo(20);
    expect(left?.y).toBeCloseTo(40);
  });

  it('shows an arrow while a lantern is still within the margin of the edge', () => {
    expect(edgeArrow(400, 800, 200, 400, 398, 400, 20, 6)).not.toBeNull();
  });
});

describe('drawing between ticks', () => {
  it('blends position and turns the short way round', () => {
    const pose = lerpPose({ x: 0, y: 0, heading: 3.1 }, { x: 10, y: 20, heading: -3.1 }, 0.5);
    expect(pose.x).toBeCloseTo(5);
    expect(pose.y).toBeCloseTo(10);
    expect(Math.abs(Math.cos(pose.heading) + 1)).toBeLessThan(1e-3);
  });

  it('uses the new pose when there is no old one', () => {
    expect(lerpPose(undefined, { x: 1, y: 2, heading: 3 }, 0.2)).toEqual({
      x: 1,
      y: 2,
      heading: 3,
    });
  });

  it('fades toward a target without overshooting', () => {
    expect(approach(0, 1, 5, 0.1)).toBeCloseTo(0.5);
    expect(approach(0.9, 1, 5, 0.1)).toBe(1);
    expect(approach(0.2, 0, 5, 0.1)).toBe(0);
  });
});

describe('camera shake', () => {
  it('stays within its strength and stops when it ends', () => {
    for (let t = 0; t < 0.35; t += 0.01) {
      const o = shakeOffset(t, 0.35, 6);
      expect(Math.abs(o.x)).toBeLessThanOrEqual(6);
      expect(Math.abs(o.y)).toBeLessThanOrEqual(6);
    }
    expect(shakeOffset(0.35, 0.35, 6)).toEqual({ x: 0, y: 0 });
    expect(shakeOffset(Infinity, 0.35, 6)).toEqual({ x: 0, y: 0 });
  });
});
