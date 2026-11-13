/** Turns the play-tester's numbers into docs/balance-report.md, with outliers called out. */
import { levelDef } from '../../src/app/campaign';
import { CAMPAIGN, SHIP_TYPES, SHOP, SMUGGLER, STAR_COINS } from '../../src/data';
import type { DifficultyId, Upgrades } from '../../src/data/types';
import type { BotId } from './bots';
import { REGION_KITS } from './kits';
import type { CellStats, LevelReport } from './run';

export interface ReportInput {
  date: string;
  seeds: number;
  levels: readonly LevelReport[];
}

/** Targets from prompts/06-levels-campaign.md and docs/CONTENT.md §6. */
const TARGET = {
  smartMinStars: 1.8,
  smartMaxStars: 2.85,
  sweeperFailMin: 0.2,
  sweeperFailMax: 0.4,
  /** A level within a region may be at most this much harder (smart stars) than the one before. */
  maxStep: 0.6,
};

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const n1 = (x: number): string => x.toFixed(1);
const n2 = (x: number): string => x.toFixed(2);

const cell = (level: LevelReport, difficulty: DifficultyId, bot: BotId): CellStats | undefined =>
  level.cells.find((c) => c.difficulty === difficulty && c.bot === bot);

const regionOf = (levelId: string): number => Number(levelId.split('-')[0]) - 1;

export function findOutliers(levels: readonly LevelReport[]): string[] {
  const notes: string[] = [];
  let previous: { region: number; stars: number } | null = null;
  for (const level of levels) {
    const region = regionOf(level.levelId);
    const finale = level.levelId.endsWith('-6');
    for (const problem of level.problems) notes.push(`**${level.levelId}** layout: ${problem}`);
    const stuck = level.cells.filter((c) => c.timeoutRate > 0);
    if (stuck.length > 0) {
      notes.push(
        `**${level.levelId}** has nights that never end (a ship stuck at sea): ${stuck.map((c) => `${c.difficulty}/${c.bot} ${pct(c.timeoutRate)}`).join(', ')}.`,
      );
    }
    const smart = cell(level, 'keeper', 'smart');
    if (smart) {
      if (smart.avgStars < TARGET.smartMinStars) {
        notes.push(
          `**${level.levelId}** is hard: the smart bot averages ${n2(smart.avgStars)} stars on Keeper (target ≥ ${TARGET.smartMinStars}).`,
        );
      }
      if (smart.avgStars > TARGET.smartMaxStars && region > 0) {
        notes.push(
          `**${level.levelId}** may be easy: the smart bot averages ${n2(smart.avgStars)} stars on Keeper.`,
        );
      }
      if (
        previous &&
        previous.region === region &&
        !finale &&
        previous.stars - smart.avgStars > TARGET.maxStep
      ) {
        notes.push(
          `**${level.levelId}** is a spike: ${n2(previous.stars - smart.avgStars)} stars harder than the level before it.`,
        );
      }
      previous = { region, stars: smart.avgStars };
    }
    const sweeper = cell(level, 'keeper', 'sweeper');
    if (sweeper && region >= 2) {
      const fail = 1 - sweeper.winRate;
      if (fail < TARGET.sweeperFailMin || fail > TARGET.sweeperFailMax) {
        notes.push(
          `**${level.levelId}**: the sweeper fails ${pct(fail)} on Keeper (target ${pct(TARGET.sweeperFailMin)}–${pct(TARGET.sweeperFailMax)}).`,
        );
      }
    }
    const order: DifficultyId[] = ['calm', 'keeper', 'storm'];
    const wins = order.map((d) => cell(level, d, 'smart')?.avgStars);
    const [calm, keeper, storm] = wins;
    if (calm !== undefined && keeper !== undefined && storm !== undefined) {
      if (calm + 0.25 < keeper || keeper + 0.25 < storm) {
        notes.push(`**${level.levelId}**: the difficulties are out of order for the smart bot.`);
      }
    }
  }
  return notes;
}

// ---- Economy (docs/CONTENT.md §8) ----

const upgradeCost = (base: number, level: number): number =>
  Math.round((base * (1 + level * SHOP.costGrowth)) / SHOP.roundTo) * SHOP.roundTo;

/** Coins to take an upgrade from `from` to `to`. */
function pathCost(id: string, from: number, to: number): number {
  const def = SHOP.upgrades.find((u) => u.id === id);
  if (!def) return 0;
  let sum = 0;
  for (let l = from; l < to; l++) sum += upgradeCost(def.baseCost, l);
  return sum;
}

function kitCost(from: Upgrades, to: Upgrades): number {
  return (['lens', 'lamp', 'gears', 'foghorn', 'flares'] as const).reduce(
    (sum, id) => sum + pathCost(id, from[id], to[id]),
    0,
  );
}

/** Coins a perfect ★★★ run of a level pays on Keeper the first time: every ship, every catch, 3 stars. */
function perfectCoins(levelId: string): number {
  const level = levelDef(levelId);
  const ships = level.ships.reduce(
    (sum, s) => sum + (s.type === 'smuggler' ? SMUGGLER.catchBonus : SHIP_TYPES[s.type].coins),
    0,
  );
  return ships + 3 * STAR_COINS.perNewStar;
}

function economyTable(levels: readonly LevelReport[]): string[] {
  const lines = [
    '| Region | ★★★ run pays | Smart bot earns (Keeper, avg) | Earned so far (★★★ runs) | Max out Brighter lamp | Ratio (target ≈ 1.3) | Next region kit costs |',
    '|---|---|---|---|---|---|---|',
  ];
  const lampMax = pathCost('lamp', 0, 5);
  let sofar = 0;
  CAMPAIGN.forEach((region, i) => {
    const ids = region.levels.map((l) => l.id);
    const perfect = ids.reduce((sum, id) => sum + perfectCoins(id), 0);
    const earned = ids.reduce((sum, id) => {
      const level = levels.find((l) => l.levelId === id);
      const smart = level ? cell(level, 'keeper', 'smart') : undefined;
      return sum + (smart ? smart.avgCoins : 0);
    }, 0);
    const from = REGION_KITS[i];
    const to = REGION_KITS[i + 1];
    const next = from && to ? String(kitCost(from, to)) : '—';
    sofar += perfect;
    lines.push(
      `| ${i + 1} ${region.id} | ${perfect} | ${Math.round(earned)} | ${sofar} | ${lampMax} | ${n2(perfect / lampMax)} | ${next} |`,
    );
  });
  const everything = SHOP.upgrades.reduce((sum, u) => sum + pathCost(u.id, 0, u.max), 0);
  lines.push(
    '',
    `Every upgrade in the shop at its maximum costs ${everything} coins (bell buoys not included).`,
  );
  return lines;
}

// ---- Summary ----

/** A few plain lines at the top: how many levels meet each target, and the economy at a glance. */
function summary(levels: readonly LevelReport[], outliers: readonly string[]): string[] {
  const smart = levels.map((l) => cell(l, 'keeper', 'smart')).filter((c) => c !== undefined);
  const smartOk = smart.filter((c) => c.avgStars >= TARGET.smartMinStars).length;
  const smartWins = smart.length > 0 ? Math.min(...smart.map((c) => c.winRate)) : 0;
  const late = levels.filter((l) => regionOf(l.levelId) >= 2);
  const sweeperOk = late.filter((l) => {
    const c = cell(l, 'keeper', 'sweeper');
    if (!c) return false;
    const fails = 1 - c.winRate;
    return fails >= TARGET.sweeperFailMin - 0.005 && fails <= TARGET.sweeperFailMax + 0.005;
  }).length;
  const lampMax = pathCost('lamp', 0, 5);
  const everything = SHOP.upgrades.reduce((sum, u) => sum + pathCost(u.id, 0, u.max), 0);
  let sofar = 0;
  let affordableIn = 0;
  const ratios = CAMPAIGN.map((region, i) => {
    const pays = region.levels.reduce((sum, l) => sum + perfectCoins(l.id), 0);
    sofar += pays;
    if (affordableIn === 0 && sofar >= everything) affordableIn = i + 1;
    return pays / lampMax;
  });
  const average = ratios.reduce((a, b) => a + b, 0) / Math.max(1, ratios.length);
  return [
    '## Summary',
    '',
    `- **Careful play:** the smart bot meets its target (at least ${TARGET.smartMinStars} stars on Keeper) on ${smartOk} of ${smart.length} levels and wins at least ${pct(smartWins)} of nights on every level.`,
    `- **Careless play:** the sweeper fails within the ${pct(TARGET.sweeperFailMin)}–${pct(TARGET.sweeperFailMax)} target on ${sweeperOk} of ${late.length} region 3–5 levels. The rest are listed under Outliers; the finales are meant to be harder.`,
    `- **Economy:** a ★★★ region pays ${n2(Math.min(...ratios))}–${n2(Math.max(...ratios))}× the cost of maxing Brighter lamp (average ${n2(average)}, target about 1.3). Every upgrade (${everything} coins) becomes affordable ${affordableIn > 0 ? `in region ${affordableIn}` : 'after the campaign'} with ★★★ runs.`,
    `- **${outliers.length} outlier notes** below. Most say a level "may be easy" for the smart bot, which knows every rock; check them against human play-tests before tuning (docs/TODO.md).`,
    '',
  ];
}

// ---- Tables ----

function summaryTable(levels: readonly LevelReport[]): string[] {
  const lines = [
    '| Level | Name | Ships | Smart ★ | Smart win | Nearest-reef ★ | Nearest-reef win | Sweeper ★ | Sweeper fails |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const level of levels) {
    const s = cell(level, 'keeper', 'smart');
    const r = cell(level, 'keeper', 'nearestReef');
    const w = cell(level, 'keeper', 'sweeper');
    lines.push(
      `| ${level.levelId} | ${level.name} | ${level.ships} | ${s ? n2(s.avgStars) : '—'} | ${s ? pct(s.winRate) : '—'} | ${r ? n2(r.avgStars) : '—'} | ${r ? pct(r.winRate) : '—'} | ${w ? n2(w.avgStars) : '—'} | ${w ? pct(1 - w.winRate) : '—'} |`,
    );
  }
  return lines;
}

/** A one-line picture of the smart bot's stars across the campaign (higher bar = easier). */
function curve(levels: readonly LevelReport[]): string[] {
  const bars = '▁▂▃▄▅▆▇█';
  const pick = (bot: BotId, value: (c: CellStats) => number): string =>
    levels
      .map((l) => {
        const c = cell(l, 'keeper', bot);
        if (!c) return ' ';
        const v = Math.max(0, Math.min(1, value(c)));
        return bars[Math.round(v * (bars.length - 1))] ?? ' ';
      })
      .join('');
  return [
    '```',
    `levels        ${levels.map((l) => l.levelId.replace('-', '')[1]).join('')}`,
    `smart ★       ${pick('smart', (c) => c.avgStars / 3)}`,
    `nearest ★     ${pick('nearestReef', (c) => c.avgStars / 3)}`,
    `sweeper wins  ${pick('sweeper', (c) => c.winRate)}`,
    '```',
  ];
}

function fullTable(levels: readonly LevelReport[], difficulty: DifficultyId): string[] {
  const lines = [
    '| Level | Bot | Win | Avg wrecks | Avg ★ | ★0 / ★1 / ★2 / ★3 | Bonus met | Avg length | Avg coins |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const level of levels) {
    for (const c of level.cells.filter((x) => x.difficulty === difficulty)) {
      lines.push(
        `| ${level.levelId} | ${c.bot} | ${pct(c.winRate)} | ${n1(c.avgWrecks)} | ${n2(c.avgStars)} | ${c.starShare.map(pct).join(' / ')} | ${pct(c.bonusRate)} | ${Math.round(c.avgSeconds)} s | ${Math.round(c.avgCoins)} |`,
      );
    }
  }
  return lines;
}

export function buildReport(input: ReportInput): string {
  const levels = [...input.levels].sort((a, b) =>
    a.levelId.localeCompare(b.levelId, 'en', { numeric: true }),
  );
  const outliers = findOutliers(levels);
  const difficulties = [...new Set(levels.flatMap((l) => l.cells.map((c) => c.difficulty)))];
  return [
    '# Balance report',
    '',
    `Generated by \`npm run playtest\` on ${input.date}: ${input.seeds} nights per level, difficulty and bot. Do not edit by hand.`,
    '',
    ...summary(levels, outliers),
    '## How to read this',
    '- **smart**: lights whichever ship is closest to trouble, drives pirates off, catches smugglers, uses the horn and flares. Plays like a careful player who knows the layout.',
    '- **nearest-reef**: always lights the ship closest to a rock.',
    '- **sweeper**: swings the beam around and back without looking at the ships.',
    '- Bots play with the upgrades a typical keeper owns on reaching each region (`tools/playtest/kits.ts`).',
    `- Targets on Keeper: smart averages at least ${TARGET.smartMinStars} stars (★★ on most levels); the sweeper fails ${pct(TARGET.sweeperFailMin)}–${pct(TARGET.sweeperFailMax)} of region 3–5 levels; no level is more than ${TARGET.maxStep} stars harder than the one before it in its region (finales excepted).`,
    '',
    '## Keeper at a glance',
    '',
    ...summaryTable(levels),
    '',
    ...curve(levels),
    '',
    '## Outliers',
    '',
    ...(outliers.length > 0 ? outliers.map((o) => `- ${o}`) : ['None.']),
    '',
    '## Economy (docs/CONTENT.md §8)',
    '',
    'A full ★★★ run of a region should pay about 1.3× the cost of maxing its most useful upgrade path (Brighter lamp here). "Next region kit" is what the bots assume a keeper buys before the next region.',
    '',
    ...economyTable(levels),
    '',
    ...difficulties.flatMap((d) => [`## All results: ${d}`, '', ...fullTable(levels, d), '']),
  ].join('\n');
}
