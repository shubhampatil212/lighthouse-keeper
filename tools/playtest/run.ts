/** Plays levels headlessly with the bots and sums up how they did. */
import { levelDef } from '../../src/app/campaign';
import type { DifficultyId, LevelDef, Upgrades } from '../../src/data/types';
import { createWorld, validateLevel } from '../../src/sim';
import { BOTS, type BotId } from './bots';

const DT = 1 / 60;
const MAX_SECONDS = 600;

export interface NightStats {
  won: boolean;
  stars: number;
  wrecked: number;
  saved: number;
  seconds: number;
  coins: number;
  bonusMet: boolean;
  /** The night hit the time cap without ending (a ship stuck somewhere). */
  timedOut: boolean;
}

export interface CellStats {
  levelId: string;
  difficulty: DifficultyId;
  bot: BotId;
  nights: number;
  winRate: number;
  avgWrecks: number;
  avgStars: number;
  /** Share of nights ending with 0, 1, 2 and 3 stars. */
  starShare: [number, number, number, number];
  avgSeconds: number;
  avgCoins: number;
  bonusRate: number;
  /** Share of nights that never ended. */
  timeoutRate: number;
}

export interface LevelReport {
  levelId: string;
  name: string;
  ships: number;
  problems: string[];
  cells: CellStats[];
}

export function playNight(
  level: LevelDef,
  difficulty: DifficultyId,
  bot: BotId,
  seed: number,
  kit: Upgrades,
): NightStats {
  const world = createWorld(level, difficulty, kit, seed);
  const play = BOTS[bot]();
  while (world.state.status === 'playing' && world.state.tick < MAX_SECONDS * 60) {
    world.step(DT, play(world));
    world.drainEvents();
  }
  const r = world.state.result;
  return {
    won: r?.outcome === 'won',
    stars: r?.stars ?? 0,
    wrecked: r?.wrecked ?? world.state.wrecked,
    saved: r?.saved ?? world.state.saved,
    seconds: r?.time ?? world.state.time,
    coins: r?.coins ?? 0,
    bonusMet: r?.bonusMet ?? false,
    timedOut: r === null,
  };
}

const mean = (xs: readonly number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

export function playCell(
  levelId: string,
  difficulty: DifficultyId,
  bot: BotId,
  seeds: number,
  kit: Upgrades,
): CellStats {
  const level = levelDef(levelId);
  const nights = Array.from({ length: seeds }, (_, i) =>
    playNight(level, difficulty, bot, 1000 + i * 7919, kit),
  );
  const share = (n: number): number => nights.filter((x) => x.stars === n).length / seeds;
  return {
    levelId,
    difficulty,
    bot,
    nights: seeds,
    winRate: nights.filter((x) => x.won).length / seeds,
    avgWrecks: mean(nights.map((x) => x.wrecked)),
    avgStars: mean(nights.map((x) => x.stars)),
    starShare: [share(0), share(1), share(2), share(3)],
    avgSeconds: mean(nights.map((x) => x.seconds)),
    avgCoins: mean(nights.map((x) => x.coins)),
    bonusRate: nights.filter((x) => x.bonusMet).length / seeds,
    timeoutRate: nights.filter((x) => x.timedOut).length / seeds,
  };
}

export function levelReport(
  levelId: string,
  difficulties: readonly DifficultyId[],
  bots: readonly BotId[],
  seeds: number,
  kit: Upgrades,
): LevelReport {
  const level = levelDef(levelId);
  return {
    levelId,
    name: level.name,
    ships: level.ships.length,
    problems: validateLevel(level),
    cells: difficulties.flatMap((d) => bots.map((b) => playCell(levelId, d, b, seeds, kit))),
  };
}
