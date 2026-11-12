import { describe, expect, it } from 'vitest';
import { computeViewport, NO_INSETS, screenToWorld, worldToScreen } from '../src/app/viewport';
import { QUALITY } from '../src/data/quality';
import { VIEWPORT } from '../src/data/viewport';
import type { Insets, Viewport } from '../src/app/viewport';

const make = (
  width: number,
  height: number,
  insets: Insets = NO_INSETS,
  dpr = 1,
  cap = 2,
): Viewport =>
  computeViewport({ width, height, insets, devicePixelRatio: dpr, maxPixelRatio: cap }, VIEWPORT);

/** The 230-unit circle fits inside the safe area on every side. */
function expectSafeCircleVisible(vp: Viewport): void {
  const r = VIEWPORT.safeRadius * vp.scale;
  expect(vp.centerX - r).toBeGreaterThanOrEqual(vp.insets.left);
  expect(vp.centerX + r).toBeLessThanOrEqual(vp.width - vp.insets.right);
  expect(vp.centerY - r).toBeGreaterThanOrEqual(vp.insets.top);
  expect(vp.centerY + r).toBeLessThanOrEqual(vp.height - vp.insets.bottom);
}

describe('computeViewport', () => {
  const sizes: [string, number, number][] = [
    ['portrait phone', 390, 844],
    ['small portrait phone', 320, 568],
    ['landscape phone', 844, 390],
    ['tablet', 820, 1180],
    ['desktop', 1440, 900],
    ['ultrawide', 3440, 1440],
    ['tiny window', 200, 150],
  ];

  it.each(sizes)('keeps the whole safe circle visible on a %s (%i×%i)', (_name, w, h) => {
    const vp = make(w, h);
    expectSafeCircleVisible(vp);
    expect(vp.centerX).toBeCloseTo(w / 2);
    expect(vp.centerY).toBeCloseTo(h / 2);
  });

  it('respects notch and home-bar insets', () => {
    const insets = { top: 47, right: 0, bottom: 34, left: 0 };
    const vp = make(390, 844, insets);
    expectSafeCircleVisible(vp);
    expect(vp.centerY).toBeCloseTo(47 + (844 - 47 - 34) / 2);
  });

  it('respects landscape side insets', () => {
    const insets = { top: 0, right: 47, bottom: 21, left: 47 };
    expectSafeCircleVisible(make(844, 390, insets));
  });

  it('uses the shorter side for the scale', () => {
    expect(make(390, 844).scale).toBeCloseTo(make(844, 390).scale);
  });

  it('caps the pixel ratio by quality level', () => {
    expect(make(390, 844, NO_INSETS, 3, QUALITY.low.maxPixelRatio).resolution).toBe(1);
    expect(make(390, 844, NO_INSETS, 3, QUALITY.medium.maxPixelRatio).resolution).toBe(1.5);
    expect(make(390, 844, NO_INSETS, 3, QUALITY.high.maxPixelRatio).resolution).toBe(2);
    expect(make(390, 844, NO_INSETS, 1, QUALITY.high.maxPixelRatio).resolution).toBe(1);
  });

  it('survives zero or negative sizes without dividing by zero', () => {
    const vp = make(0, 0);
    expect(Number.isFinite(vp.scale)).toBe(true);
    expect(vp.scale).toBeGreaterThan(0);
  });

  it('converts between world and screen positions', () => {
    const vp = make(1440, 900);
    expect(worldToScreen(vp, 0, 0)).toEqual({ x: vp.centerX, y: vp.centerY });
    const p = screenToWorld(
      vp,
      ...(Object.values(worldToScreen(vp, 120, -80)) as [number, number]),
    );
    expect(p.x).toBeCloseTo(120);
    expect(p.y).toBeCloseTo(-80);
  });
});
