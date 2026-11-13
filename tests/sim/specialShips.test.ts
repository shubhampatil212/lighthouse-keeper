/** Phase 04 ship types: sailboat, ferry, tugboat, smuggler (docs/CONTENT.md §2), and harbors. */
import { describe, expect, it } from 'vitest';
import { NO_UPGRADES, SEA, SHIP_BEHAVIOR, SMUGGLER, TUG } from '../../src/data';
import {
  createWorld,
  launchTow,
  spawnShip,
  stepShip,
  stepTows,
  towWithTugs,
  type ShipFate,
  type SimEvent,
} from '../../src/sim';
import { DT, aimAt, dark, lit, rock, shipRules, testLevel } from './helpers';

const collect = (): { events: SimEvent[]; emit: (e: SimEvent) => void } => {
  const events: SimEvent[] = [];
  return { events, emit: (e) => events.push(e) };
};

describe('sailboat', () => {
  it('is pushed 1.5× as hard by the current while dark', () => {
    const drift = (type: 'fishing' | 'sailboat'): number => {
      const calm = spawnShip(1, type, 0, 1, 3, shipRules());
      const pushed = spawnShip(1, type, 0, 1, 3, shipRules(0, 4));
      calm.x = pushed.x = 200;
      stepShip(calm, [], dark, shipRules(), DT, 1, () => undefined);
      stepShip(pushed, [], dark, shipRules(0, 4), DT, 1, () => undefined);
      return pushed.y - calm.y;
    };
    expect(drift('fishing')).toBeCloseTo(4 * DT, 10);
    expect(drift('sailboat')).toBeCloseTo(4 * 1.5 * DT, 10);
  });

  it('ignores the current when lit, like every ship', () => {
    const calm = spawnShip(1, 'sailboat', 0, 1, 3, shipRules());
    const pushed = spawnShip(1, 'sailboat', 0, 1, 3, shipRules(0, 4));
    stepShip(calm, [], lit, shipRules(), DT, 1, () => undefined);
    stepShip(pushed, [], lit, shipRules(0, 4), DT, 1, () => undefined);
    expect(pushed.y).toBeCloseTo(calm.y, 10);
  });
});

describe('ferry', () => {
  it('fails the night when it wrecks, whatever the allowance', () => {
    const level = testLevel({
      ships: [{ type: 'ferry', at: 0, angle: 0 }],
      reefs: [{ x: 120, y: 0, rocks: [{ dx: 0, dy: 0, r: 10 }] }],
    });
    const world = createWorld(level, 'calm', NO_UPGRADES, 1);
    while (world.state.status === 'playing') {
      world.step(DT, aimAt(Math.PI));
      for (const ship of world.state.ships) {
        ship.x = 120;
        ship.y = 0;
      }
    }
    expect(world.state.result).toMatchObject({
      outcome: 'failed',
      failReason: 'preciousLost',
      wrecked: 1,
    });
  });
});

describe('tugboat', () => {
  it('slows dark ships near it while it is lit, and says so once', () => {
    const rules = shipRules();
    const tug = spawnShip(1, 'tugboat', 0, 1, 1, rules);
    const near = spawnShip(2, 'fishing', 0, 1, 2, rules);
    const far = spawnShip(3, 'fishing', Math.PI, 1, 3, rules);
    tug.lit = true;
    near.y += TUG.towRadius - 5;
    const { events, emit } = collect();
    towWithTugs([tug, near, far], TUG, 1, emit);
    towWithTugs([tug, near, far], TUG, 2, emit);
    expect(near.towedBy).toBe(tug.id);
    expect(far.towedBy).toBe(0);
    expect(events).toEqual([{ type: 'tugTowing', tick: 1, tugId: 1, shipId: 2 }]);

    const before = { x: near.x, y: near.y };
    stepShip(near, [], dark, rules, DT, 3, () => undefined);
    const moved = Math.hypot(near.x - before.x, near.y - before.y);
    expect(moved).toBeCloseTo(18 * SHIP_BEHAVIOR.darkSpeedFactor * TUG.speedFactor * DT, 6);
  });

  it('stops towing when it falls dark, and never tows lit ships', () => {
    const rules = shipRules();
    const tug = spawnShip(1, 'tugboat', 0, 1, 1, rules);
    const other = spawnShip(2, 'fishing', 0, 1, 2, rules);
    tug.lit = true;
    other.lit = true;
    towWithTugs([tug, other], TUG, 1, () => undefined);
    expect(other.towedBy).toBe(0);
    other.lit = false;
    tug.lit = false;
    towWithTugs([tug, other], TUG, 2, () => undefined);
    expect(other.towedBy).toBe(0);
  });
});

describe('smuggler', () => {
  it('heads across the sea to an exit point that misses the island', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const ship = spawnShip(1, 'smuggler', 0, 1, seed, shipRules());
      if (!ship.exit) throw new Error('no exit');
      // The straight line from spawn to exit passes the island at a distance.
      const { x: ax, y: ay } = ship;
      const { x: bx, y: by } = ship.exit;
      const miss = Math.abs(ax * by - ay * bx) / Math.hypot(bx - ax, by - ay);
      expect(miss).toBeGreaterThan(40);
    }
    expect(spawnShip(1, 'fishing', 0, 1, 1, shipRules()).exit).toBeNull();
  });

  it('slips away in the dark: escaped, never wrecked, never docked', () => {
    const ship = spawnShip(1, 'smuggler', 0, 1, 4, shipRules());
    const rocks = [rock(0, 60, 12), rock(0, -60, 12)];
    let fate: ShipFate = { kind: 'sailing' };
    for (let tick = 1; tick < 120 * 60 && fate.kind === 'sailing'; tick++) {
      fate = stepShip(ship, rocks, dark, shipRules(), DT, tick, () => undefined);
    }
    expect(fate.kind).toBe('escaped');
  });

  it('turns away from the light', () => {
    const ship = spawnShip(1, 'smuggler', 0, 1, 4, shipRules());
    ship.x = 120;
    ship.y = 0;
    ship.heading = Math.PI; // heading toward the island
    for (let tick = 1; tick < 110; tick++)
      stepShip(ship, [], lit, shipRules(), DT, tick, () => undefined);
    expect(Math.cos(ship.heading)).toBeGreaterThan(0.5); // now heading away (east)
  });

  it('is caught after 2 s of unbroken light; a break restarts the count', () => {
    const run = (pattern: (tick: number) => boolean): { tick: number; fate: ShipFate } => {
      const ship = spawnShip(1, 'smuggler', 0, 1, 4, shipRules());
      ship.x = 100;
      let fate: ShipFate = { kind: 'sailing' };
      let tick = 0;
      while (fate.kind === 'sailing' && tick < 600) {
        tick++;
        fate = stepShip(
          ship,
          [],
          pattern(tick) ? lit : dark,
          shipRules(),
          DT,
          tick,
          () => undefined,
        );
      }
      return { tick, fate };
    };
    const steady = run(() => true);
    expect(steady.fate.kind).toBe('caught');
    expect(steady.tick).toBeGreaterThanOrEqual(SMUGGLER.catchSeconds * 60);
    expect(steady.tick).toBeLessThanOrEqual(SMUGGLER.catchSeconds * 60 + 1);
    const broken = run((tick) => tick !== 60);
    expect(broken.tick).toBeGreaterThan(steady.tick + 50);
  });

  it('pays the catch bonus, counts as resolved, and the coast guard tows it away', () => {
    const level = testLevel({ ships: [{ type: 'smuggler', at: 0, angle: 0 }] });
    const world = createWorld(level, 'storm', NO_UPGRADES, 2);
    const events: SimEvent[] = [];
    world.step(DT, aimAt(null));
    const smuggler = world.state.ships[0];
    if (!smuggler) throw new Error('no smuggler');
    // Well inside the map, so it can't outrun the light before it's caught.
    smuggler.x = 100;
    for (let i = 0; i < 60 * 60; i++) {
      world.state.mapLight = 1;
      world.step(DT, aimAt(null));
      events.push(...world.drainEvents());
      if (world.state.status !== 'playing' && world.state.tows.length === 0) break;
    }
    const caught = events.find((e) => e.type === 'smugglerCaught');
    expect(caught).toMatchObject({ coins: Math.round(SMUGGLER.catchBonus * 1.25) });
    expect(world.state.result).toMatchObject({ outcome: 'won', caught: 1, wrecked: 0, saved: 0 });
    expect(events.some((e) => e.type === 'smugglerTowed')).toBe(true);
    expect(world.state.tows).toEqual([]);
  });
});

describe('coast guard', () => {
  it('sails out from the island, hooks on, then tows the smuggler off the map', () => {
    const smuggler = spawnShip(5, 'smuggler', 0, 1, 1, shipRules());
    smuggler.x = 120;
    smuggler.y = 40;
    let tows = [launchTow(9, smuggler, 34)];
    const { events, emit } = collect();
    for (let tick = 1; tick < 120 * 60 && tows.length > 0; tick++) {
      tows = stepTows(tows, SMUGGLER, SEA, SHIP_BEHAVIOR, () => false, DT, tick, emit);
    }
    expect(tows).toEqual([]);
    expect(events.map((e) => e.type)).toEqual(['smugglerTowed']);
  });
});

describe('harbors', () => {
  const harbors = [
    { x: 0, y: 0, radius: 38 },
    { x: -90, y: 60, radius: 24 },
  ];

  it('a lit ship docks at its own harbor and sails round the island to get there', () => {
    const rules = shipRules(0, 0, harbors);
    const ship = spawnShip(1, 'fishing', 0, 1, 1, rules, 1);
    let fate: ShipFate = { kind: 'sailing' };
    let closest = Infinity;
    for (let tick = 1; tick < 120 * 60 && fate.kind === 'sailing'; tick++) {
      fate = stepShip(ship, [], lit, rules, DT, tick, () => undefined);
      closest = Math.min(closest, Math.hypot(ship.x, ship.y));
    }
    expect(fate.kind).toBe('saved');
    expect(Math.hypot(ship.x - -90, ship.y - 60)).toBeLessThan(24);
    expect(closest).toBeGreaterThanOrEqual(34);
  });

  it('ships are sent to the harbor the level names', () => {
    const level = testLevel({
      harbors,
      ships: [
        { type: 'fishing', at: 0, angle: 0, harbor: 1 },
        { type: 'fishing', at: 0, angle: 1 },
      ],
    });
    const world = createWorld(level, 'keeper', NO_UPGRADES, 1);
    world.step(DT, aimAt(null));
    expect(world.state.ships.map((s) => s.harbor)).toEqual([1, 0]);
  });
});
