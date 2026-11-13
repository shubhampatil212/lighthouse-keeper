import { describe, expect, it } from 'vitest';
import { DEMO_LEVELS, LEVEL_1_2, LEVELS } from '../../src/data';
import { validateLevel } from '../../src/sim';
import { HAZARD_LEVELS } from './hazardLevels';
import { testLevel } from './helpers';

describe('level data', () => {
  for (const level of [...Object.values(LEVELS), ...Object.values(DEMO_LEVELS)]) {
    it(`level ${level.id} passes the layout and fairness checks`, () => {
      expect(validateLevel(level)).toEqual([]);
    });
  }

  it('1-2 "The cargo run" has six ships, two of them cargo, and asks to save both', () => {
    expect(LEVEL_1_2.ships).toHaveLength(6);
    expect(LEVEL_1_2.ships.filter((s) => s.type === 'cargo')).toHaveLength(2);
    expect(LEVEL_1_2.bonus).toEqual({ kind: 'saveAllOfType', type: 'cargo' });
  });
});

describe('hazard test levels', () => {
  for (const level of HAZARD_LEVELS) {
    it(`${level.id} passes the layout and fairness checks`, () => {
      expect(validateLevel(level)).toEqual([]);
    });
  }
});

describe('validateLevel', () => {
  it('rejects a rock near the edge of the beam range', () => {
    const level = testLevel({ reefs: [{ x: 170, y: 0, rocks: [{ dx: 0, dy: 0, r: 8 }] }] });
    expect(validateLevel(level).join()).toMatch(/edge of the beam's range/);
  });

  it('rejects a rock touching the harbor', () => {
    const level = testLevel({ reefs: [{ x: 40, y: 0, rocks: [{ dx: 0, dy: 0, r: 8 }] }] });
    expect(validateLevel(level).join()).toMatch(/touches a harbor/);
  });

  it('rejects a bonus about ships the level never sends', () => {
    const level = testLevel({ bonus: { kind: 'saveAllOfType', type: 'cargo' } });
    expect(validateLevel(level).join()).toMatch(/none are scheduled/);
  });
});
