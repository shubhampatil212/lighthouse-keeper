/** Phase 04 hazards (docs/CONTENT.md §3): icebergs, lightning, storm waves, whirlpools, pirates, fog. */
import { describe, expect, it } from 'vitest';
import { HAZARDS, NO_UPGRADES, SEA, SHIP_BEHAVIOR, SHIP_TYPES } from '../../src/data';
import {
  createRng,
  createWorld,
  driftIcebergs,
  fogEntry,
  spawnPirate,
  spawnShip,
  startLightning,
  stepLightning,
  stepPirates,
  stepShip,
  stepWaves,
  type PirateRules,
  type Rock,
  type SeaForces,
  type ShipFate,
  type SimEvent,
} from '../../src/sim';
import { DT, aimAt, dark, lit, rock, shipRules, testLevel } from './helpers';

const LIMIT = 190 - SEA.reefRangeMargin;

const iceberg = (x: number, y: number, r: number, vx: number, vy: number): Rock => ({
  ...rock(x, y, r, 9),
  kind: 'iceberg',
  vx,
  vy,
});

describe('fog bands', () => {
  const band = { x: 0, y: 0, angle: 0, length: 40, width: 10 };

  it('finds where a path enters the band', () => {
    expect(fogEntry(band, -50, 0, 50, 0)).toBeCloseTo(0.3, 10);
    expect(fogEntry(band, 0, 0, 50, 0)).toBe(0); // starts inside
    expect(fogEntry(band, -50, 20, 50, 20)).toBeNull(); // passes beside it
    expect(fogEntry(band, -50, 0, -30, 0)).toBeNull(); // stops short
  });

  it('comes from the level and shortens the beam in the world', () => {
    const level = testLevel({
      hazards: [{ kind: 'fogBand', x: 0, y: -90, angle: 0, length: 100, width: 20 }],
    });
    const world = createWorld(level, 'keeper', NO_UPGRADES, 1);
    expect(world.state.fogBands).toHaveLength(1);
    expect(world.isLit(0, -120)).toBe(true); // north is where the beam starts
    expect(world.isLit(0, -130)).toBe(false);
  });
});

describe('icebergs', () => {
  it('drift and always stay inside the fair zone', () => {
    const bergs = [
      iceberg(90, 0, 25, 6, 0),
      iceberg(-80, 10, 18, -3, 4),
      iceberg(0, 90, 30, 0, -5),
    ];
    const start = bergs.map((b) => [b.x, b.y]);
    for (let i = 0; i < 300 * 60; i++) driftIcebergs(bergs, LIMIT, 38, HAZARDS.iceberg, DT);
    bergs.forEach((b, i) => {
      expect([b.x, b.y]).not.toEqual(start[i]);
      const d = Math.hypot(b.x, b.y);
      expect(d + b.r).toBeLessThanOrEqual(LIMIT + 0.2);
      expect(d - b.r).toBeGreaterThanOrEqual(38 + HAZARDS.iceberg.harborGap - 0.2);
    });
  });

  it('bounce off reefs, leaving a channel open', () => {
    const reef = rock(100, 0, 10);
    const berg = iceberg(100, 70, 20, 0, -5);
    for (let i = 0; i < 20 * 60; i++) driftIcebergs([reef, berg], 400, 0, HAZARDS.iceberg, DT);
    expect(Math.hypot(berg.x - reef.x, berg.y - reef.y) - 30).toBeGreaterThan(
      HAZARDS.iceberg.laneGap - 1,
    );
  });

  it('wreck a ship that sails into them head-on', () => {
    const ship = spawnShip(1, 'fishing', 0, 1, 1, shipRules());
    ship.heading = Math.PI;
    const berg = iceberg(200, 0, 20, 0, 0);
    let fate: ShipFate = { kind: 'sailing' };
    for (let t = 1; t < 600 && fate.kind === 'sailing'; t++) {
      fate = stepShip(ship, [berg], dark, shipRules(), DT, t, () => undefined);
    }
    expect(fate).toEqual({ kind: 'wrecked', cause: 'iceberg', reefIndex: 9 });
  });

  it('shove a ship aside when they drift into its side', () => {
    const ship = spawnShip(1, 'fishing', 0, 1, 1, shipRules());
    ship.x = 150;
    ship.y = 0;
    ship.heading = Math.PI / 2; // sailing south; the iceberg comes from the west
    const berg = iceberg(150 - 22, 0, 20, 0, 0);
    const fate = stepShip(ship, [berg], dark, shipRules(), DT, 1, () => undefined);
    expect(fate.kind).toBe('sailing');
    expect(Math.hypot(ship.x - berg.x, ship.y - berg.y)).toBeGreaterThanOrEqual(
      20 + 6 * 0.45 - 1e-9,
    );
  });
});

describe('lightning', () => {
  it('glows a warning 1 s ahead, then lights the map for 0.25 s, every 8–15 s', () => {
    const rng = createRng(4);
    const config = HAZARDS.lightning;
    const state = startLightning(rng, config);
    const events: SimEvent[] = [];
    let lit = 0;
    for (let tick = 1; tick <= 120 * 60; tick++) {
      const flash = stepLightning(state, rng, config, DT, tick, (e) => events.push(e));
      if (flash > 0) {
        expect(flash).toBe(config.flash);
        lit++;
      }
    }
    const strikes = events.filter((e) => e.type === 'lightning');
    const warnings = events.filter((e) => e.type === 'lightningWarning');
    expect(strikes.length).toBe(lit);
    expect(strikes.length).toBeGreaterThanOrEqual(120 / 15 - 1);
    expect(strikes.length).toBeLessThanOrEqual(120 / 8);
    strikes.forEach((strike, i) => {
      const warning = warnings[i];
      expect(strike.tick - (warning?.tick ?? 0)).toBeCloseTo(60, -1);
      const prev = strikes[i - 1];
      if (prev) {
        expect(strike.tick - prev.tick).toBeGreaterThanOrEqual(8 * 60 - 1);
        expect(strike.tick - prev.tick).toBeLessThanOrEqual(15 * 60 + 1);
      }
    });
  });

  it('lights the whole map in the world for a moment', () => {
    const world = createWorld(
      testLevel({ hazards: [{ kind: 'lightning' }] }),
      'keeper',
      NO_UPGRADES,
      3,
    );
    let flashTicks = 0;
    for (let i = 0; i < 16 * 60; i++) {
      world.step(DT, aimAt(null));
      if (world.isLit(0, 200)) flashTicks++;
    }
    expect(flashTicks).toBeGreaterThanOrEqual(HAZARDS.lightning.flash * 60 - 1);
  });
});

describe('storm waves', () => {
  it('change direction every 10 s', () => {
    const rng = createRng(1);
    const state = { angle: 0, timer: HAZARDS.stormWaves.period };
    const events: SimEvent[] = [];
    for (let tick = 1; tick <= 35 * 60; tick++) {
      stepWaves(state, rng, HAZARDS.stormWaves, DT, tick, (e) => events.push(e));
    }
    expect(events.map((e) => e.type)).toEqual(['wavesShifted', 'wavesShifted', 'wavesShifted']);
  });

  it('a lit ship leans into them and still gets home', () => {
    const sea: SeaForces = { pushX: 0, pushY: 6, whirlpools: [] };
    const ship = spawnShip(1, 'cargo', 0, 0.8, 1, shipRules());
    let fate: ShipFate = { kind: 'sailing' };
    let drift = 0;
    for (let t = 1; t < 60 * 60 && fate.kind === 'sailing'; t++) {
      fate = stepShip(ship, [], lit, shipRules(), DT, t, () => undefined, sea);
      drift = Math.max(drift, Math.abs(ship.y));
    }
    expect(fate.kind).toBe('saved');
    expect(drift).toBeLessThan(20);
  });
});

describe('whirlpools', () => {
  const sea: SeaForces = { pushX: 0, pushY: 0, whirlpools: [{ x: 100, y: 0 }] };

  it('pull ships within 60 units toward the centre, and wreck them at the core', () => {
    const ship = spawnShip(1, 'fishing', 0, 1, 1, shipRules());
    ship.x = 100;
    ship.y = 50;
    ship.heading = 0;
    ship.speed = 0;
    const events: SimEvent[] = [];
    let fate: ShipFate = { kind: 'sailing' };
    for (let t = 1; t < 60 * 60 && fate.kind === 'sailing'; t++) {
      fate = stepShip(ship, [], dark, shipRules(), DT, t, (e) => events.push(e), sea);
    }
    expect(fate).toEqual({ kind: 'wrecked', cause: 'whirlpool', reefIndex: null });
    expect(events.filter((e) => e.type === 'shipInWhirlpool')).toHaveLength(1);
  });

  it('leave ships outside the pull alone', () => {
    const ship = spawnShip(1, 'fishing', 0, 1, 1, shipRules());
    ship.x = 100;
    ship.y = 70;
    ship.speed = 0;
    stepShip(ship, [], dark, shipRules(), DT, 1, () => undefined, sea);
    expect(ship.y).toBeCloseTo(70, 10);
  });

  it('a lit ship steers clear and escapes', () => {
    const ship = spawnShip(1, 'cargo', 0, 0.8, 1, shipRules());
    ship.x = 140;
    ship.y = 25;
    ship.heading = Math.PI;
    let fate: ShipFate = { kind: 'sailing' };
    for (let t = 1; t < 60 * 60 && fate.kind === 'sailing'; t++) {
      fate = stepShip(ship, [], lit, shipRules(), DT, t, () => undefined, sea);
    }
    expect(fate.kind).toBe('saved');
  });
});

describe('pirates', () => {
  const rules: PirateRules = {
    pirate: HAZARDS.pirate,
    sea: SEA,
    behavior: SHIP_BEHAVIOR,
    types: SHIP_TYPES,
    huntLimit: 190,
  };

  /** A dark fishing boat sitting still at (x, y), and a pirate nearby. */
  function setup(px: number, py: number, sx = 100, sy = 0) {
    const pirate = spawnPirate(50, 0, 1, SEA);
    pirate.x = px;
    pirate.y = py;
    const ship = spawnShip(1, 'fishing', 0, 1, 1, shipRules());
    ship.x = sx;
    ship.y = sy;
    ship.lit = false;
    return { pirate, ship };
  }

  function run(
    pirate: ReturnType<typeof setup>['pirate'],
    ships: ReturnType<typeof setup>['ship'][],
    seconds: number,
    light: (x: number, y: number) => { x: number; y: number } | null = dark,
  ) {
    const events: SimEvent[] = [];
    let boardedAt = -1;
    for (let t = 1; t <= seconds * 60 && boardedAt < 0; t++) {
      const boarded = stepPirates([pirate], ships, [], light, rules, DT, t, (e) => events.push(e));
      if (boarded.length > 0) boardedAt = t;
    }
    return { events, boardedAt };
  }

  it('leaves lit ships, smugglers and ships beyond the beam alone', () => {
    const litShip = setup(110, 0);
    litShip.ship.lit = true;
    expect(run(litShip.pirate, [litShip.ship], 6).boardedAt).toBe(-1);

    const smuggler = setup(110, 0);
    smuggler.ship.exit = { x: -300, y: 0 };
    expect(run(smuggler.pirate, [smuggler.ship], 6).boardedAt).toBe(-1);

    const far = setup(220, 0, 210, 0);
    expect(run(far.pirate, [far.ship], 1).events).toEqual([]);
  });

  it('flees the light for 5 s, then comes back to hunt', () => {
    const { pirate, ship } = setup(130, 0);
    let litTicks = 30;
    const light = () => (litTicks-- > 0 ? { x: 0, y: 0 } : null);
    const { events, boardedAt } = run(pirate, [ship], 20, light);
    expect(events[0]).toMatchObject({ type: 'pirateDrivenOff' });
    const hunt = events.find((e) => e.type === 'pirateHunting');
    expect(hunt?.tick).toBeGreaterThanOrEqual(30 + HAZARDS.pirate.scareSeconds * 60);
    expect(boardedAt).toBeGreaterThan(0);
  });

  it('sink ships in the world, counted as wrecks with the pirate as cause', () => {
    const level = testLevel({
      ships: [{ type: 'fishing', at: 0, angle: 0 }],
      hazards: [{ kind: 'pirate', at: 0, angle: 0.2 }],
    });
    const world = createWorld(level, 'keeper', NO_UPGRADES, 1);
    const events: SimEvent[] = [];
    while (world.state.status === 'playing' && world.state.tick < 120 * 60) {
      world.step(DT, aimAt(Math.PI)); // beam pointing away
      events.push(...world.drainEvents());
    }
    expect(events.some((e) => e.type === 'pirateArrived')).toBe(true);
    expect(events.find((e) => e.type === 'shipWrecked')).toMatchObject({
      cause: 'pirate',
      reefIndex: null,
    });
  });
});

describe('determinism with every hazard', () => {
  it('replays a stormy, pirate-ridden night exactly', () => {
    const level = testLevel({
      ships: [0, 5, 10, 15].map((at, i) => ({ type: 'fishing' as const, at, angle: i * 1.5 })),
      hazards: [
        { kind: 'lightning' },
        { kind: 'stormWaves' },
        { kind: 'whirlpool', x: 100, y: 0 },
        { kind: 'iceberg', x: -90, y: 0 },
        { kind: 'pirate', at: 2, angle: 2 },
        { kind: 'fogBand', x: 0, y: 120, angle: 0, length: 100, width: 20 },
      ],
    });
    const play = () => {
      const world = createWorld(level, 'keeper', NO_UPGRADES, 77);
      const events: SimEvent[] = [];
      for (let i = 0; i < 60 * 60; i++) {
        world.step(DT, aimAt(i * 0.01));
        events.push(...world.drainEvents());
      }
      return { events, state: JSON.stringify(world.state) };
    };
    const a = play();
    expect(a.events.some((e) => e.type === 'lightning')).toBe(true);
    expect(play()).toEqual(a);
  });
});
