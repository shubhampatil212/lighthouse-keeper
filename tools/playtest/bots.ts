/**
 * Scripted players for the bot play-tester. The beam is still turn-limited, so a bot's skill is only
 * in what it chooses to light. Each bot is made fresh for every night (some remember a little).
 */
import { HAZARDS } from '../../src/data';
import {
  NO_INTENTS,
  canReach,
  wrapAngle,
  type Intents,
  type Ship,
  type World,
} from '../../src/sim';
import { lightSourcesOf } from '../../src/sim/worldNight';

export type Bot = (world: World) => Intents;
export type BotId = 'smart' | 'nearestReef' | 'sweeper';
export const BOT_IDS: readonly BotId[] = ['smart', 'nearestReef', 'sweeper'];

const DT = 1 / 60;
/** How far ahead (seconds) the smart bot looks for trouble, and in what steps. */
const HORIZON = 7;
const LOOK_STEP = 0.25;
/** The smart bot sticks with a ship for at least this long before switching. */
const HOLD = 0.7;
/** Ticks between the smart bot's decisions (0.1 s). */
const THINK_EVERY = 6;

const aim = (angle: number, extra: Partial<Intents> = {}): Intents => ({
  ...NO_INTENTS,
  aimAngle: wrapAngle(angle),
  ...extra,
});

/** The lamp the player steers, as a point. */
function activeLamp(world: World): { x: number; y: number } {
  const { state } = world;
  return state.activeLamp === 1 && state.lamp2 ? state.lamp2 : { x: 0, y: 0 };
}

const angleFrom = (from: { x: number; y: number }, to: { x: number; y: number }): number =>
  Math.atan2(to.y - from.y, to.x - from.x);

/** Sweeps the beam round at full speed, turning back every few seconds. Ignores the ships. */
export function sweeper(): Bot {
  let dir = 1;
  let timer = 0;
  return (world) => {
    timer += DT;
    if (timer > 4) {
      timer = 0;
      dir = -dir;
    }
    return aim(world.state.beam.angle + dir * 0.6);
  };
}

/** Always lights the ship nearest to any rock (or, with none, the one at sea longest). */
export function nearestReef(): Bot {
  return (world) => {
    const { ships, rocks } = world.state;
    const range = world.setup.beam.range;
    let best: Ship | null = null;
    let bestGap = Infinity;
    for (const ship of ships) {
      if (Math.hypot(ship.x, ship.y) > range) continue;
      for (const rock of rocks) {
        const gap = Math.hypot(rock.x - ship.x, rock.y - ship.y) - rock.r;
        if (gap < bestGap) {
          bestGap = gap;
          best = ship;
        }
      }
    }
    const target = best ?? ships[0];
    return target ? aim(Math.atan2(target.y, target.x)) : NO_INTENTS;
  };
}

/** Seconds until a dark ship, drifting as it is now, runs into something; Infinity if it's clear. */
function timeToDanger(world: World, ship: Ship): number {
  const { state, setup } = world;
  const dark = setup.ships.behavior.darkSpeedFactor;
  const pushX = state.waves ? Math.cos(state.waves.angle) * HAZARDS.stormWaves.push : 0;
  const pushY = state.waves ? Math.sin(state.waves.angle) * HAZARDS.stormWaves.push : 0;
  const vx = Math.cos(ship.heading) * ship.speed * dark + setup.ships.currentX + pushX;
  const vy = Math.sin(ship.heading) * ship.speed * dark + setup.ships.currentY + pushY;
  const half = setup.ships.types[ship.type].length / 2;
  for (let t = 0; t <= HORIZON; t += LOOK_STEP) {
    const x = ship.x + vx * t;
    const y = ship.y + vy * t;
    for (const rock of state.rocks) {
      const rx = rock.x + rock.vx * t;
      const ry = rock.y + rock.vy * t;
      if (Math.hypot(rx - x, ry - y) < rock.r + half + 4) return t;
    }
    for (const w of state.whirlpools) {
      if (Math.hypot(w.x - x, w.y - y) < HAZARDS.whirlpool.pullRadius * 0.6) return t;
    }
  }
  return Infinity;
}

/** How badly a ship needs the light (higher = sooner). */
function urgencyOf(ship: Ship, hunted: boolean, danger: number): number {
  if (ship.type === 'smuggler') return ship.lit ? 3 : 1;
  if (hunted) return 9;
  if (danger < Infinity) return 10 - danger;
  return Math.min(2, ship.darkTime / 3);
}

/**
 * A careful player who knows the layout: lights whichever ship is closest to trouble (rocks,
 * whirlpools, a hunting pirate), keeps the precious ferry lit, catches smugglers when it's quiet,
 * drives pirates off, and uses the horn and flares when several ships are in trouble at once.
 */
export function smart(): Bot {
  let targetId = 0;
  let held = 0;
  let last: Intents = NO_INTENTS;
  let tick = 0;
  return (world) => {
    // Like a person, it rethinks a few times a second rather than every frame.
    tick++;
    if (tick % THINK_EVERY !== 1)
      return { ...last, foghorn: false, flare: false, switchLamp: false };
    last = decide(world);
    return last;
  };

  function decide(world: World): Intents {
    const { state, setup } = world;
    const level = setup.level;
    held += DT * THINK_EVERY;

    // Rank every ship the light can reach.
    const ranked: { ship: Ship; urgency: number }[] = [];
    let inTrouble = 0;
    let nearIsland = 0;
    const light = lightSourcesOf(setup, state);
    for (const ship of state.ships) {
      const d = Math.hypot(ship.x, ship.y);
      const reachable = canReach(light, ship.x, ship.y);
      if (!reachable) continue;
      const hunted = state.pirates.some((p) => p.mode === 'hunt' && p.targetId === ship.id);
      // Judged as if left in the dark, so a lit ship by a reef keeps the light until it's clear.
      const danger = timeToDanger(world, ship);
      let urgency = urgencyOf(ship, hunted, danger);
      // Playing for a "no ship in the dark too long" bonus: reach ships before their time runs out.
      if (
        level.bonus.kind === 'noLongDark' &&
        !ship.lit &&
        ship.darkTime > level.bonus.seconds - 3
      ) {
        urgency += 5;
      }
      if (setup.ships.types[ship.type].precious) urgency += 2;
      if (danger < 2.5 && !ship.lit) inTrouble++;
      if (d < 140 && !ship.lit && ship.type !== 'smuggler') nearIsland++;
      ranked.push({ ship, urgency });
    }
    ranked.sort((a, b) => b.urgency - a.urgency);

    const current = ranked.find((r) => r.ship.id === targetId);
    const top = ranked[0];
    let pick = current;
    if (!pick || (top && held > HOLD && top.urgency > pick.urgency + 1)) {
      pick = top;
      held = 0;
    }

    const extra: Partial<Intents> = {};
    const noFlare = level.bonus.kind === 'noAbility' && level.bonus.ability === 'flare';
    const noHorn = level.bonus.kind === 'noAbility' && level.bonus.ability === 'foghorn';
    if (!noFlare && inTrouble >= 3 && state.abilities.flares > 0) extra.flare = true;
    if (!noHorn && setup.upgrades.foghorn > 0 && state.abilities.foghornCooldown <= 0) {
      if (inTrouble >= 2 || nearIsland >= 3) extra.foghorn = true;
    }

    // A pirate on the hunt is driven off first when no ship is about to hit a rock.
    const hunter = state.pirates.find((p) => p.mode === 'hunt');
    if (hunter && (!pick || pick.urgency < 8)) {
      return aim(angleFrom(activeLamp(world), hunter), extra);
    }
    if (!pick) return { ...NO_INTENTS, ...extra };
    targetId = pick.ship.id;

    // With a second lamp, steer whichever lamp is nearer the ship.
    if (state.lamp2) {
      const toMain = Math.hypot(pick.ship.x, pick.ship.y);
      const toSecond = Math.hypot(pick.ship.x - state.lamp2.x, pick.ship.y - state.lamp2.y);
      const want = toSecond < toMain * 0.8 ? 1 : 0;
      if (want !== state.activeLamp) extra.switchLamp = true;
      const from = want === 1 ? state.lamp2 : { x: 0, y: 0 };
      return aim(angleFrom(from, pick.ship), extra);
    }
    return aim(Math.atan2(pick.ship.y, pick.ship.x), extra);
  }
}

export const BOTS: Readonly<Record<BotId, () => Bot>> = { smart, nearestReef, sweeper };
