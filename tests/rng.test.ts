import { describe, expect, it } from 'vitest';
import { createRng, seedFromString } from '../src/sim/rng';

const take = (seed: number, n: number): number[] => {
  const rng = createRng(seed);
  return Array.from({ length: n }, () => rng.float());
};

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(take(42, 100)).toEqual(take(42, 100));
  });

  it('gives different sequences for different seeds', () => {
    expect(take(1, 10)).not.toEqual(take(2, 10));
  });

  it('keeps float() in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 10_000; i++) {
      const v = rng.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('keeps range() in [min, max)', () => {
    const rng = createRng(9);
    for (let i = 0; i < 2_000; i++) {
      const v = rng.range(-3, 5);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThan(5);
    }
  });

  it('returns every integer in [min, max] from int(), and nothing outside', () => {
    const rng = createRng(11);
    const seen = new Set<number>();
    for (let i = 0; i < 2_000; i++) {
      const v = rng.int(2, 6);
      expect(Number.isInteger(v)).toBe(true);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([2, 3, 4, 5, 6]);
  });

  it('picks only items from the list, and can pick each of them', () => {
    const rng = createRng(13);
    const items = ['fishing', 'cargo', 'ferry'] as const;
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(rng.pick(items));
    expect([...seen].sort()).toEqual(['cargo', 'ferry', 'fishing']);
  });

  it('refuses to pick from an empty list', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });

  it('can resume from a saved state', () => {
    const a = createRng(99);
    a.float();
    a.float();
    const b = createRng(a.state);
    expect(take(b.state, 5)).toEqual([a.float(), a.float(), a.float(), a.float(), a.float()]);
  });

  it('is stable across versions (golden values)', () => {
    expect(take(12345, 3).map((v) => v.toFixed(8))).toMatchInlineSnapshot(`
      [
        "0.97972827",
        "0.30675226",
        "0.48420542",
      ]
    `);
  });
});

describe('seedFromString', () => {
  it('is deterministic and distinguishes different days', () => {
    expect(seedFromString('2026-11-12')).toBe(seedFromString('2026-11-12'));
    expect(seedFromString('2026-11-12')).not.toBe(seedFromString('2026-11-13'));
  });
});
