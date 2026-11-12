import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, LEVEL_1_2, NO_UPGRADES, SEA } from '../../src/data';
import { createRng, createWorld, type SimEvent, type World } from '../../src/sim';
import { DT, aimAt, chasingPlayer, playNight, testLevel, type Player } from './helpers';

/** A restless scripted player: picks a new aim every 1.5 s from its own fixed random stream. */
function scriptedPlayer(): Player {
  const rng = createRng(99);
  let aim = 0;
  return (world) => {
    if (world.state.tick % 90 === 0) aim = rng.range(-Math.PI, Math.PI);
    return aim;
  };
}

describe('determinism', () => {
  it('gives exactly the same night for the same seed and the same inputs', () => {
    const a = playNight(LEVEL_1_2, 'keeper', 1234, scriptedPlayer());
    const b = playNight(LEVEL_1_2, 'keeper', 1234, scriptedPlayer());
    expect(a.events.length).toBeGreaterThan(10);
    expect(b.events).toEqual(a.events);
    expect(JSON.stringify(b.world.state)).toBe(JSON.stringify(a.world.state));
  });

  it('gives a different night for a different seed', () => {
    const a = playNight(LEVEL_1_2, 'keeper', 1234, scriptedPlayer());
    const b = playNight(LEVEL_1_2, 'keeper', 4321, scriptedPlayer());
    expect(b.events).not.toEqual(a.events);
  });

  it('keeps the reef layout fixed for every seed', () => {
    const a = createWorld(LEVEL_1_2, 'keeper', NO_UPGRADES, 1);
    const b = createWorld(LEVEL_1_2, 'storm', NO_UPGRADES, 2);
    expect(b.state.rocks).toEqual(a.state.rocks);
  });
});

describe('spawning', () => {
  it('follows the schedule, stretched by the difficulty spawn interval', () => {
    for (const id of ['calm', 'keeper', 'storm'] as const) {
      const { events } = playNight(LEVEL_1_2, id, 5, chasingPlayer);
      const spawned = events.filter((e) => e.type === 'shipSpawned');
      const expected = LEVEL_1_2.ships.map((s) => s.at * DIFFICULTIES[id].spawnInterval);
      expect(spawned.map((e) => e.tick * DT)).toEqual(
        expected.map((t) => expect.closeTo(t, 1) as unknown),
      );
      expect(spawned.map((e) => e.shipType)).toEqual(LEVEL_1_2.ships.map((s) => s.type));
    }
  });

  it('puts ships on the spawn ring, on the right side of the map', () => {
    const { events } = playNight(LEVEL_1_2, 'keeper', 5, chasingPlayer);
    const first = events.find((e) => e.type === 'shipSpawned');
    if (first?.type !== 'shipSpawned') throw new Error('no ship spawned');
    expect(Math.hypot(first.x, first.y)).toBeCloseTo(SEA.spawnRadius, 6);
    expect(first.y).toBeLessThan(0); // the first ship comes from the north
  });
});

describe('ending the night', () => {
  it('wins with three stars when every ship gets home and the bonus is met', () => {
    const world = createWorld(LEVEL_1_2, 'storm', NO_UPGRADES, 3);
    const events: SimEvent[] = [];
    while (world.state.status === 'playing') {
      world.state.mapLight = 1;
      world.step(DT, aimAt(null));
      events.push(...world.drainEvents());
    }
    expect(world.state.result).toMatchObject({
      outcome: 'won',
      failReason: null,
      stars: 3,
      saved: 6,
      wrecked: 0,
      total: 6,
      bonusMet: true,
      // Storm pays ×1.25: 4 × round(12.5) + 2 × round(18.75).
      coins: 4 * 13 + 2 * 19,
    });
    expect(events.filter((e) => e.type === 'levelEnded')).toHaveLength(1);
    expect(events.at(-1)?.type).toBe('levelEnded');
  });

  /** Steers every ship at sea straight onto the first rock. */
  function wreckEverything(world: World): void {
    const rock = world.state.rocks[0];
    if (!rock) throw new Error('no rock');
    for (const ship of world.state.ships) {
      ship.x = rock.x;
      ship.y = rock.y;
    }
  }

  const doomed = testLevel({
    ships: [0, 1, 2, 3, 4, 5].map((at) => ({ type: 'fishing' as const, at, angle: 0 })),
    reefs: [{ x: 100, y: 0, rocks: [{ dx: 0, dy: 0, r: 10 }] }],
  });

  it('fails when wrecks go past the allowance, and then only the beam moves', () => {
    const world = createWorld(doomed, 'keeper', NO_UPGRADES, 1);
    const events: SimEvent[] = [];
    while (world.state.status === 'playing') {
      world.step(DT, aimAt(1));
      wreckEverything(world);
      events.push(...world.drainEvents());
    }
    expect(world.state.result).toMatchObject({
      outcome: 'failed',
      failReason: 'tooManyWrecks',
      stars: 0,
      wrecked: DIFFICULTIES.keeper.wreckAllowance + 1,
    });
    expect(events.filter((e) => e.type === 'shipWrecked')).toHaveLength(4);

    const frozen = JSON.stringify({ ...world.state, beam: null, tick: 0, time: 0 });
    const beamBefore = world.state.beam.angle;
    for (let i = 0; i < 120; i++) world.step(DT, aimAt(2));
    expect(world.drainEvents()).toEqual([]);
    expect(JSON.stringify({ ...world.state, beam: null, tick: 0, time: 0 })).toBe(frozen);
    expect(world.state.beam.angle).not.toBe(beamBefore);
  });

  it('still wins with one star when wrecks stay within the allowance', () => {
    const world = createWorld(doomed, 'calm', NO_UPGRADES, 1);
    let wrecks = 0;
    while (world.state.status === 'playing') {
      world.state.mapLight = 1;
      world.step(DT, aimAt(null));
      if (wrecks < 2 && world.state.ships.length > 0) {
        wreckEverything(world);
        wrecks += world.state.ships.length;
      }
    }
    expect(world.state.result).toMatchObject({ outcome: 'won', stars: 1, wrecked: 2, saved: 4 });
  });
});

describe('upgrades', () => {
  it('lights the reef a bell buoy is placed on', () => {
    const world = createWorld(LEVEL_1_2, 'keeper', { ...NO_UPGRADES, buoys: [2] }, 1);
    const reef = LEVEL_1_2.reefs[2];
    if (!reef) throw new Error('no reef');
    expect(world.isLit(reef.x, reef.y)).toBe(true);
    expect(createWorld(LEVEL_1_2, 'keeper', NO_UPGRADES, 1).isLit(reef.x, reef.y)).toBe(false);
  });
});
