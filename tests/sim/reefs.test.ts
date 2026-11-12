import { describe, expect, it } from 'vitest';
import { SEA } from '../../src/data';
import { buildRocks, rockAt, updateReefMemory, type SimEvent } from '../../src/sim';
import { DT, testLevel } from './helpers';

describe('buildRocks', () => {
  it('uses hand-placed rocks when given', () => {
    const level = testLevel({ reefs: [{ x: 100, y: 0, rocks: [{ dx: 5, dy: -5, r: 9 }] }] });
    expect(buildRocks(level, SEA)).toEqual([
      { x: 105, y: -5, r: 9, reef: 0, memory: 0, lit: false },
    ]);
  });

  it('generates 2 to 4 rocks per reef from the level seed, the same every time', () => {
    const level = testLevel({
      reefs: [
        { x: 100, y: 0 },
        { x: -100, y: 0 },
      ],
    });
    const rocks = buildRocks(level, SEA);
    expect(buildRocks(level, SEA)).toEqual(rocks);
    for (const reef of [0, 1]) {
      const mine = rocks.filter((r) => r.reef === reef);
      expect(mine.length).toBeGreaterThanOrEqual(2);
      expect(mine.length).toBeLessThanOrEqual(4);
    }
    for (const r of rocks) {
      expect(r.r).toBeGreaterThanOrEqual(6);
      expect(r.r).toBeLessThan(12);
    }
  });
});

describe('reef memory', () => {
  const level = testLevel({ reefs: [{ x: 100, y: 0, rocks: [{ dx: 0, dy: 0, r: 8 }] }] });

  function run(rocks: ReturnType<typeof buildRocks>, lit: boolean, seconds: number, memory = 3) {
    const events: SimEvent[] = [];
    for (let i = 0; i < Math.round(seconds * 60); i++) {
      updateReefMemory(
        rocks,
        1,
        () => lit,
        memory,
        DT,
        i,
        (e) => events.push(e),
      );
    }
    return events;
  }

  it('is full while lit and fades over the difficulty memory time', () => {
    const rocks = buildRocks(level, SEA);
    run(rocks, true, DT);
    expect(rocks[0]?.memory).toBe(1);
    run(rocks, false, 1.5);
    expect(rocks[0]?.memory).toBeCloseTo(0.5, 6);
    run(rocks, false, 1.6);
    expect(rocks[0]?.memory).toBe(0);
  });

  it('reports a reveal only when a forgotten reef comes into the light', () => {
    const rocks = buildRocks(level, SEA);
    expect(run(rocks, true, 1)).toHaveLength(1);
    run(rocks, false, 1);
    expect(run(rocks, true, 1)).toHaveLength(0);
    run(rocks, false, 4);
    expect(run(rocks, true, 1)).toEqual([{ type: 'reefRevealed', tick: 0, reefIndex: 0 }]);
  });
});

describe('rockAt', () => {
  const rocks = buildRocks(
    testLevel({ reefs: [{ x: 100, y: 0, rocks: [{ dx: 0, dy: 0, r: 8 }] }] }),
    SEA,
  );
  it('finds a rock the hull touches', () => {
    expect(rockAt(rocks, 110, 0, 3)).toBe(rocks[0]);
    expect(rockAt(rocks, 112, 0, 3)).toBeNull();
  });
});
