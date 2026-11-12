import { describe, expect, it } from 'vitest';
import { aimFromPointer, dialDelta, keyboardAim } from '../../src/input';

const center = { centerX: 200, centerY: 400 };

describe('aimFromPointer (follow finger)', () => {
  it('points from the island toward the pointer', () => {
    expect(aimFromPointer(center, 300, 400, 12)).toBeCloseTo(0);
    expect(aimFromPointer(center, 200, 300, 12)).toBeCloseTo(-Math.PI / 2);
    expect(aimFromPointer(center, 100, 400, 12)).toBeCloseTo(Math.PI);
  });

  it('ignores a pointer right on top of the island', () => {
    expect(aimFromPointer(center, 205, 404, 12)).toBeNull();
  });
});

describe('dialDelta (drag to rotate)', () => {
  it('measures the sweep the short way, across ±PI', () => {
    expect(dialDelta(0.1, 0.3)).toBeCloseTo(0.2);
    expect(dialDelta(3.0, -3.0)).toBeCloseTo(2 * Math.PI - 6);
    expect(dialDelta(-3.0, 3.0)).toBeCloseTo(6 - 2 * Math.PI);
  });
});

describe('keyboardAim', () => {
  it('aims just ahead of the beam while a direction is held', () => {
    expect(keyboardAim(false, true, 1, 0.45)).toBeCloseTo(1.45);
    expect(keyboardAim(true, false, 1, 0.45)).toBeCloseTo(0.55);
    expect(keyboardAim(false, true, 3, 0.45)).toBeCloseTo(3.45 - 2 * Math.PI);
  });

  it('gives no aim with neither or both held', () => {
    expect(keyboardAim(false, false, 1, 0.45)).toBeNull();
    expect(keyboardAim(true, true, 1, 0.45)).toBeNull();
  });
});
