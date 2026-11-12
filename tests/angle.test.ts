import { describe, expect, it } from 'vitest';
import { lerpAngle, wrapAngle } from '../src/sim/angle';

describe('wrapAngle', () => {
  it('wraps into (-PI, PI]', () => {
    for (const a of [-10, -Math.PI, -1, 0, 1, Math.PI, 4, 10, 100]) {
      const w = wrapAngle(a);
      expect(w).toBeGreaterThan(-Math.PI);
      expect(w).toBeLessThanOrEqual(Math.PI);
      expect(Math.cos(w)).toBeCloseTo(Math.cos(a));
      expect(Math.sin(w)).toBeCloseTo(Math.sin(a));
    }
  });
});

describe('lerpAngle', () => {
  it('goes the short way across the PI seam', () => {
    const mid = lerpAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.5);
    expect(Math.abs(mid)).toBeCloseTo(Math.PI);
  });

  it('returns the ends at t = 0 and t = 1', () => {
    expect(lerpAngle(0.3, 1.2, 0)).toBeCloseTo(0.3);
    expect(lerpAngle(0.3, 1.2, 1)).toBeCloseTo(1.2);
  });
});
