import { describe, expect, it } from 'vitest';
import { createFixedStepper } from '../src/app/gameLoop';

const config = { stepHz: 60, maxCatchUpSteps: 5 };
const STEP = 1 / 60;

describe('createFixedStepper', () => {
  it('runs one step per 1/60 s', () => {
    const stepper = createFixedStepper(config);
    let total = 0;
    for (let i = 0; i < 60; i++) total += stepper.advance(STEP).steps;
    expect(total).toBe(60);
  });

  it('runs the same number of steps at 120 Hz and 30 Hz frame rates', () => {
    const at = (fps: number): number => {
      const stepper = createFixedStepper(config);
      let total = 0;
      for (let i = 0; i < fps * 2; i++) total += stepper.advance(1 / fps).steps;
      return total;
    };
    expect(Math.abs(at(120) - 120)).toBeLessThanOrEqual(1);
    expect(Math.abs(at(30) - 120)).toBeLessThanOrEqual(1);
  });

  it('carries the remainder as alpha', () => {
    const stepper = createFixedStepper(config);
    const { steps, alpha } = stepper.advance(STEP * 2.5);
    expect(steps).toBe(2);
    expect(alpha).toBeCloseTo(0.5);
  });

  it('caps catch-up steps after a long stall and drops the backlog', () => {
    const stepper = createFixedStepper(config);
    expect(stepper.advance(3).steps).toBe(5);
    expect(stepper.advance(STEP).steps).toBe(1);
  });

  it('keeps alpha in [0, 1)', () => {
    const stepper = createFixedStepper(config);
    for (const dt of [0, 0.001, 0.007, 0.016, 0.017, 0.033, 0.5, 2]) {
      const { alpha } = stepper.advance(dt);
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThan(1);
    }
  });

  it('ignores negative time and resets cleanly', () => {
    const stepper = createFixedStepper(config);
    expect(stepper.advance(-1).steps).toBe(0);
    stepper.advance(STEP * 0.9);
    stepper.reset();
    expect(stepper.advance(STEP * 0.5).steps).toBe(0);
  });
});
