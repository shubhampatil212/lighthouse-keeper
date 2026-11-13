/**
 * Fairness guard (CLAUDE.md game-feel rule): a wreck must never feel random. Before any ship hits
 * a reef, the player must have had at least ~2 seconds when lighting it would have saved it.
 *
 * For each wreck a "lazy" player causes, we rewind, put the beam on the doomed ship, keep it there
 * (turn-limited) and see whether it gets home. We look for the latest moment this still works, then
 * check the ship was within beam range and could be saved for a full 2 s up to that moment.
 */
import { describe, expect, it } from 'vitest';
import { BEAM, NO_UPGRADES } from '../../src/data';
import type { DifficultyId, LevelDef } from '../../src/data/types';
import { createWorld, restoreWorld, type WorldState, type WreckCause } from '../../src/sim';
import { DT, aimAt, frozenPlayer, step, sweepingPlayer, type Player } from './helpers';

/** Each case replays hundreds of nights. */
const TIMEOUT_MS = 120_000;
const WINDOW_TICKS = 2 * 60;
const SAMPLE_TICKS = 30;
/** How far back from the wreck we look for the rescue window. */
const SEARCH_TICKS = 20 * 60;
const SNAPSHOT_EVERY = 30;
const DIFFICULTIES: DifficultyId[] = ['calm', 'keeper', 'storm'];
const PLAYERS: Record<string, Player> = { frozen: frozenPlayer, sweeping: sweepingPlayer };

interface Wreck {
  tick: number;
  shipId: number;
  cause: WreckCause;
}

interface Night {
  level: LevelDef;
  difficulty: DifficultyId;
  player: Player;
  snapshots: readonly WorldState[];
}

/** Plays a night with a lazy player, keeping copies of the state every half second. */
function lazyNight(level: LevelDef, difficulty: DifficultyId, seed: number, player: Player) {
  const world = createWorld(level, difficulty, NO_UPGRADES, seed);
  const snapshots: WorldState[] = [structuredClone(world.state)];
  const wrecks: Wreck[] = [];
  while (world.state.status === 'playing' && world.state.tick < 600 * 60) {
    step(world, player);
    for (const event of world.drainEvents()) {
      if (event.type === 'shipWrecked') {
        wrecks.push({ tick: event.tick, shipId: event.shipId, cause: event.cause });
      }
    }
    if (world.state.tick % SNAPSHOT_EVERY === 0) snapshots.push(structuredClone(world.state));
  }
  return { wrecks, snapshots };
}

/**
 * Replays the lazy night up to `fromTick`, then lights the doomed ship and follows it.
 * Says whether the ship got home, and if not, why.
 */
type Rescue = 'saved' | 'not at sea' | 'out of beam range' | 'wrecked anyway';

function savableFrom(night: Night, wreck: Wreck, fromTick: number): Rescue {
  const base = [...night.snapshots].reverse().find((s) => s.tick <= fromTick);
  if (!base) return 'not at sea';
  const world = restoreWorld(night.level, night.difficulty, NO_UPGRADES, structuredClone(base));
  while (world.state.tick < fromTick) step(world, night.player);
  world.drainEvents();

  const target = world.state.ships.find((s) => s.id === wreck.shipId);
  if (!target) return 'not at sea';
  if (Math.hypot(target.x, target.y) > BEAM.range) return 'out of beam range';
  const angle = Math.atan2(target.y, target.x);
  world.state.beam.angle = angle;
  world.state.beam.target = angle;

  const deadline = world.state.tick + 300 * 60;
  while (world.state.tick < deadline) {
    const ship = world.state.ships.find((s) => s.id === wreck.shipId);
    world.step(DT, aimAt(ship ? Math.atan2(ship.y, ship.x) : null));
    for (const event of world.drainEvents()) {
      if (event.type === 'shipSaved' && event.shipId === wreck.shipId) return 'saved';
      if (event.type === 'shipWrecked' && event.shipId === wreck.shipId) return 'wrecked anyway';
    }
    // The night failed for other reasons while this ship was still safely at sea.
    if (world.state.status !== 'playing') return 'saved';
  }
  return 'wrecked anyway';
}

/**
 * Null if the player had a 2 s window to save the ship; otherwise why not.
 * Walks back from the wreck in half-second steps, looking for a run of savable moments 2 s long.
 */
function checkWreck(night: Night, wreck: Wreck): string | null {
  const needed = WINDOW_TICKS / SAMPLE_TICKS + 1;
  let run = 0;
  let longest = 0;
  for (let t = wreck.tick - SAMPLE_TICKS; t >= wreck.tick - SEARCH_TICKS; t -= SAMPLE_TICKS) {
    const rescue = savableFrom(night, wreck, t);
    if (rescue === 'not at sea') break;
    run = rescue === 'saved' ? run + 1 : 0;
    longest = Math.max(longest, run);
    if (run >= needed) return null;
  }
  const seconds = longest > 0 ? ((longest - 1) * SAMPLE_TICKS) / 60 : 0;
  return `the longest stretch when lighting it would have saved it was ${seconds.toFixed(1)} s`;
}

/**
 * Registers the fairness checks for one level: every wreck a lazy player causes had a 2 s rescue
 * window, and nothing wrecks under a map-wide light. `cause`: the wreck cause the level's hazard must
 * actually produce in these runs.
 */
export function describeFairness(level: LevelDef, seeds: number, cause?: WreckCause): void {
  describe(`fairness: level ${level.id}`, () => {
    let hazardWrecks = 0;
    for (const difficulty of DIFFICULTIES) {
      for (const [name, player] of Object.entries(PLAYERS)) {
        it(
          `every wreck had a 2 s rescue window (${difficulty}, ${name} player)`,
          () => {
            const unfair: string[] = [];
            let wreckCount = 0;
            for (let seed = 1; seed <= seeds; seed++) {
              const { wrecks, snapshots } = lazyNight(level, difficulty, seed, player);
              wreckCount += wrecks.length;
              hazardWrecks += wrecks.filter((w) => w.cause === cause).length;
              const night: Night = { level, difficulty, player, snapshots };
              for (const wreck of wrecks) {
                const why = checkWreck(night, wreck);
                if (why) unfair.push(`seed ${seed}, ship ${wreck.shipId}: ${why}`);
              }
            }
            // The lazy players must actually cause wrecks, or the test proves nothing.
            expect(wreckCount).toBeGreaterThan(seeds / 4);
            expect(unfair).toEqual([]);
          },
          TIMEOUT_MS,
        );
      }
    }

    if (cause) {
      it(`the lazy players really do lose ships to the ${cause} (or the checks prove nothing)`, () => {
        expect(hazardWrecks).toBeGreaterThan(0);
      });
    }

    it(
      'nothing ever wrecks when the whole sea is lit',
      () => {
        for (const difficulty of DIFFICULTIES) {
          for (let seed = 1; seed <= seeds; seed++) {
            const world = createWorld(level, difficulty, NO_UPGRADES, seed);
            while (world.state.status === 'playing' && world.state.tick < 600 * 60) {
              world.state.mapLight = 1;
              step(world, frozenPlayer);
            }
            expect(world.state.result?.wrecked, `${difficulty} seed ${seed}`).toBe(0);
            expect(world.state.status).toBe('won');
          }
        }
      },
      TIMEOUT_MS,
    );
  });
}
