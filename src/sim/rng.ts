/**
 * Seeded random numbers for the simulation (mulberry32).
 * The same seed always gives the same sequence, so a night can be replayed exactly.
 */
export interface Rng {
  /** A float in [0, 1). */
  float(): number;
  /** A float in [min, max). */
  range(min: number, max: number): number;
  /** An integer in [min, max], both ends included. */
  int(min: number, max: number): number;
  /** One element of a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** The internal state, so a run can be saved and resumed. */
  readonly state: number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const float = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    float,
    range: (min, max) => min + float() * (max - min),
    int: (min, max) => {
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      return lo + Math.floor(float() * (hi - lo + 1));
    },
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('rng.pick needs at least one item');
      return items[Math.floor(float() * items.length)] as T;
    },
    get state() {
      return state;
    },
  };
}

/** Turns a text seed (for example a daily seed like "2026-11-12") into a number. */
export function seedFromString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
