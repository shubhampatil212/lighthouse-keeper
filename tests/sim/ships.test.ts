import { describe, expect, it } from 'vitest';
import { SEA, SHIP_BEHAVIOR, SHIP_TYPES } from '../../src/data';
import type { ShipTypeId } from '../../src/data/types';
import {
  spawnShip,
  stepShip,
  type LightOrigin,
  type Rock,
  type Ship,
  type ShipFate,
  type SimEvent,
} from '../../src/sim';
import { DT, dark, lit, rock, shipRules as rules } from './helpers';

/** A ship on the spawn ring due east of the island. */
function eastShip(type: ShipTypeId = 'fishing', seed = 1, r = rules()): Ship {
  const ship = spawnShip(1, type, 0, 1, seed, r);
  ship.heading = Math.PI;
  return ship;
}

function sail(
  ship: Ship,
  rocks: Rock[],
  light: (x: number, y: number) => LightOrigin | null,
  seconds: number,
  r = rules(),
): { fate: ShipFate; events: SimEvent[] } {
  const events: SimEvent[] = [];
  let fate: ShipFate = { kind: 'sailing' };
  for (let tick = 1; tick <= seconds * 60 && fate.kind === 'sailing'; tick++) {
    fate = stepShip(ship, rocks, light, r, DT, tick, (e) => events.push(e));
  }
  return { fate, events };
}

describe('spawnShip', () => {
  it('starts on the spawn ring at the type speed', () => {
    const ship = spawnShip(3, 'cargo', Math.PI / 2, 1.15, 9, rules());
    expect(ship.x).toBeCloseTo(0, 6);
    expect(ship.y).toBeCloseTo(SEA.spawnRadius, 6);
    expect(ship.speed).toBeCloseTo(12 * 1.15);
    expect(ship.lit).toBe(false);
  });
});

describe('lit ships', () => {
  for (const type of ['fishing', 'cargo'] as const) {
    it(`steer around a reef in their path and get home (${type})`, () => {
      const ship = eastShip(type);
      const reef = rock(130, 2, 12);
      let closest = Infinity;
      let fate: ShipFate = { kind: 'sailing' };
      for (let tick = 1; tick < 60 * 60 && fate.kind === 'sailing'; tick++) {
        fate = stepShip(ship, [reef], lit, rules(), DT, tick, () => undefined);
        closest = Math.min(closest, Math.hypot(ship.x - reef.x, ship.y - reef.y) - reef.r);
      }
      expect(fate.kind).toBe('saved');
      expect(closest).toBeGreaterThan(SHIP_TYPES[type].width * SHIP_BEHAVIOR.hullCollisionFactor);
    });
  }

  it('turn more slowly when they are cargo ships', () => {
    const turnOnce = (type: ShipTypeId): number => {
      const ship = eastShip(type);
      ship.heading = Math.PI / 2; // facing south; the harbor is west
      stepShip(ship, [], lit, rules(), DT, 1, () => undefined);
      return Math.abs(ship.heading - Math.PI / 2);
    };
    expect(turnOnce('fishing')).toBeCloseTo(SHIP_BEHAVIOR.litTurnRate * DT, 10);
    expect(turnOnce('cargo')).toBeCloseTo(SHIP_BEHAVIOR.litTurnRate * 0.7 * DT, 10);
  });

  it('move at full speed and ignore the current', () => {
    const calm = eastShip();
    const pushed = eastShip('fishing', 1, rules(0, 5));
    stepShip(calm, [], lit, rules(), DT, 1, () => undefined);
    stepShip(pushed, [], lit, rules(0, 5), DT, 1, () => undefined);
    expect(pushed.x).toBeCloseTo(calm.x, 10);
    expect(pushed.y).toBeCloseTo(calm.y, 10);
    expect(SEA.spawnRadius - calm.x).toBeCloseTo(18 * DT, 6);
  });
});

describe('dark ships', () => {
  it('drift at 60% speed', () => {
    const ship = eastShip();
    const before = { x: ship.x, y: ship.y };
    stepShip(ship, [], dark, rules(), DT, 1, () => undefined);
    expect(Math.hypot(ship.x - before.x, ship.y - before.y)).toBeCloseTo(18 * 0.6 * DT, 6);
  });

  it('are pushed by the current', () => {
    const calm = eastShip();
    const pushed = eastShip('fishing', 1, rules(0, 5));
    calm.x = pushed.x = 200;
    stepShip(calm, [], dark, rules(), DT, 1, () => undefined);
    stepShip(pushed, [], dark, rules(0, 5), DT, 1, () => undefined);
    expect(pushed.y - calm.y).toBeCloseTo(5 * DT, 10);
  });

  it('are never pushed out past the spawn ring', () => {
    const calm = eastShip();
    const pushed = eastShip('fishing', 1, rules(8, 0));
    stepShip(calm, [], dark, rules(), DT, 1, () => undefined);
    stepShip(pushed, [], dark, rules(8, 0), DT, 1, () => undefined);
    expect(pushed.x).toBeCloseTo(calm.x, 10);
  });

  it('drift the same way for the same seed, and differently for another', () => {
    const track = (seed: number): number[] => {
      const ship = eastShip('fishing', seed);
      sail(ship, [], dark, 10);
      return [ship.x, ship.y, ship.heading];
    };
    expect(track(5)).toEqual(track(5));
    expect(track(5)).not.toEqual(track(6));
  });

  it('are marked lost once, after 4 s in the dark', () => {
    const ship = eastShip();
    const { events } = sail(ship, [], dark, 6);
    const lost = events.filter((e) => e.type === 'shipLost');
    expect(lost).toHaveLength(1);
    // Within one tick: summing 1/60 two hundred and forty times lands a hair under 4.
    expect(lost[0]?.tick).toBeGreaterThanOrEqual(SHIP_BEHAVIOR.lostAfter * 60);
    expect(lost[0]?.tick).toBeLessThanOrEqual(SHIP_BEHAVIOR.lostAfter * 60 + 1);
    expect(ship.lost).toBe(true);
  });

  it('stop being lost when lit, and can be lost again', () => {
    const ship = eastShip();
    sail(ship, [], dark, 5);
    const { events: litEvents } = sail(ship, [], lit, DT);
    expect(litEvents.map((e) => e.type)).toEqual(['shipLit']);
    expect(ship.lost).toBe(false);
    const { events } = sail(ship, [], dark, 5);
    expect(events.filter((e) => e.type === 'shipLost')).toHaveLength(1);
  });
});

describe('every ship', () => {
  it('wrecks when its hull touches a rock', () => {
    const ship = eastShip();
    const { fate } = sail(ship, [rock(240, 0, 8)], dark, 2);
    expect(fate.kind).toBe('wrecked');
  });

  it('is saved on entering the harbor zone', () => {
    const ship = eastShip();
    ship.x = SEA.defaultHarborRadius + 1;
    const { fate } = sail(ship, [], lit, 1);
    expect(fate.kind).toBe('saved');
  });

  it('keeps a short wake', () => {
    const ship = eastShip();
    sail(ship, [], lit, 5);
    expect(ship.wake).toHaveLength(SHIP_BEHAVIOR.wakeLength);
    const last = ship.wake.at(-1);
    expect(Math.hypot((last?.x ?? 0) - ship.x, (last?.y ?? 0) - ship.y)).toBeLessThan(18 * 0.2);
  });
});
