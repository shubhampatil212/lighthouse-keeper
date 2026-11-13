import { describe, expect, it } from 'vitest';
import { DEFAULT_STARS, DIFFICULTIES, LOOP } from '../../src/data';
import {
  allShipsResolved,
  createObjective,
  failReason,
  starsFor,
  type SimEvent,
} from '../../src/sim';
import { testLevel } from './helpers';

describe('failReason', () => {
  it('fails only when wrecks go past the allowance', () => {
    expect(failReason(3, 3, false)).toBeNull();
    expect(failReason(4, 3, false)).toBe('tooManyWrecks');
  });

  it('fails when a precious ship is lost', () => {
    expect(failReason(0, 3, true)).toBe('preciousLost');
  });
});

describe('allShipsResolved', () => {
  it('is true once every ship is resolved (home, wrecked, caught or escaped)', () => {
    expect(allShipsResolved(6, 5)).toBe(false);
    expect(allShipsResolved(6, 6)).toBe(true);
  });
});

describe('starsFor', () => {
  it.each([
    ['failed', 0, true, 0],
    ['won', 0, true, 3],
    ['won', 0, false, 2],
    ['won', 1, true, 2],
    ['won', 2, true, 1],
    ['won', 3, false, 1],
  ] as const)('%s with %i wrecks, bonus %s → %i stars', (outcome, wrecks, bonus, stars) => {
    expect(starsFor(outcome, wrecks, bonus, DEFAULT_STARS)).toBe(stars);
  });
});

describe('bonus objectives', () => {
  const saved = (shipType: 'fishing' | 'cargo'): SimEvent => ({
    type: 'shipSaved',
    tick: 1,
    shipId: 1,
    shipType,
    coins: 10,
    x: 0,
    y: 0,
  });
  const wrecked = (shipType: 'fishing' | 'cargo'): SimEvent => ({
    type: 'shipWrecked',
    tick: 1,
    shipId: 1,
    shipType,
    cause: 'reef',
    reefIndex: 0,
    x: 0,
    y: 0,
  });
  const level = testLevel({
    ships: [
      { type: 'cargo', at: 0, edge: 'north' },
      { type: 'fishing', at: 1, edge: 'north' },
      { type: 'cargo', at: 2, edge: 'north' },
    ],
  });

  it('"none" is always met', () => {
    const objective = createObjective({ kind: 'none' }, level, DIFFICULTIES.keeper, LOOP.stepHz);
    expect(objective.isMet(objective.start(), 0)).toBe(true);
  });

  it('"save all of a type" needs every ship of that type home', () => {
    const objective = createObjective(
      { kind: 'saveAllOfType', type: 'cargo' },
      level,
      DIFFICULTIES.keeper,
      LOOP.stepHz,
    );
    const progress = objective.start();
    objective.onEvent(progress, saved('cargo'));
    objective.onEvent(progress, wrecked('fishing'));
    expect(objective.isMet(progress, 0)).toBe(false);
    objective.onEvent(progress, saved('cargo'));
    expect(objective.isMet(progress, 0)).toBe(true);
  });

  it('"save all of a type" breaks when one of them wrecks', () => {
    const objective = createObjective(
      { kind: 'saveAllOfType', type: 'cargo' },
      level,
      DIFFICULTIES.keeper,
      LOOP.stepHz,
    );
    const progress = objective.start();
    objective.onEvent(progress, saved('cargo'));
    objective.onEvent(progress, wrecked('cargo'));
    objective.onEvent(progress, saved('cargo'));
    expect(objective.isMet(progress, 0)).toBe(false);
  });
});
