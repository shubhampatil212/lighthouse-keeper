/**
 * The keeper's abilities (docs/GDD.md §3.4): the foghorn slows nearby ships, a flare lights the whole
 * map, and with a second lighthouse the player switches which lamp they steer while the other one
 * sweeps slowly on its own.
 */
import type { AbilitiesConfig, BeamFeelConfig, FoghornConfig, Upgrades } from '../data/types';
import { wrapAngle } from './angle';
import { stepBeam, type BeamState, type BeamStats } from './beam';
import type { Emit } from './events';
import type { Intents } from './intents';
import type { Ship } from './ships';

export interface AbilityState {
  /** Seconds until the foghorn can sound again. */
  foghornCooldown: number;
  /** Flares left tonight. */
  flares: number;
}

/** The second lighthouse: where it stands and where its beam points. */
export interface LampState extends BeamState {
  x: number;
  y: number;
}

/** Cooldown at a foghorn upgrade level (level 1 = the base; each further level is shorter). */
export function foghornCooldown(config: FoghornConfig, level: number): number {
  return Math.max(0, config.cooldown - (Math.max(1, level) - 1) * config.cooldownPerLevel);
}

export function startAbilities(upgrades: Upgrades): AbilityState {
  // "+1 charge per level (starts at 1)": the flare upgrade's level is the number of charges.
  return { foghornCooldown: 0, flares: Math.max(0, upgrades.flares) };
}

export interface AbilityContext {
  abilities: AbilityState;
  upgrades: Upgrades;
  config: AbilitiesConfig;
  ships: readonly Ship[];
  tick: number;
  emit: Emit;
  /** Lights the whole map for at least this many seconds. */
  lightMap(seconds: number): void;
}

/** Sounds the foghorn: every ship within its radius of the island slows for a few seconds. */
export function soundFoghorn(ctx: AbilityContext): void {
  const { abilities, config, tick, emit } = ctx;
  if (ctx.upgrades.foghorn < 1) {
    emit({ type: 'abilityUnavailable', tick, ability: 'foghorn', reason: 'locked' });
    return;
  }
  if (abilities.foghornCooldown > 0) {
    emit({ type: 'abilityUnavailable', tick, ability: 'foghorn', reason: 'cooldown' });
    return;
  }
  const horn = config.foghorn;
  const slowed: number[] = [];
  for (const ship of ctx.ships) {
    if (Math.hypot(ship.x, ship.y) > horn.radius) continue;
    ship.hornTimer = horn.duration;
    slowed.push(ship.id);
  }
  abilities.foghornCooldown = foghornCooldown(horn, ctx.upgrades.foghorn);
  emit({ type: 'foghornUsed', tick, shipIds: slowed });
}

export function fireFlare(ctx: AbilityContext): void {
  const { abilities, tick, emit } = ctx;
  if (abilities.flares <= 0) {
    const reason = ctx.upgrades.flares < 1 ? 'locked' : 'empty';
    emit({ type: 'abilityUnavailable', tick, ability: 'flare', reason });
    return;
  }
  abilities.flares--;
  ctx.lightMap(ctx.config.flare.seconds);
  emit({ type: 'flareFired', tick, chargesLeft: abilities.flares });
}

export function coolDown(abilities: AbilityState, dt: number): void {
  abilities.foghornCooldown = Math.max(0, abilities.foghornCooldown - dt);
}

/**
 * Turns the lamps for one tick. The lamp the player steers follows the aim (turn-limited); the other
 * sweeps slowly round by itself. Returns the lamp now steered (0 = the island's, 1 = the second).
 */
export function stepLamps(
  main: BeamState,
  second: LampState | null,
  active: number,
  intents: Intents,
  stats: BeamStats,
  feel: BeamFeelConfig,
  sweepSpeed: number,
  dt: number,
  tick: number,
  emit: Emit,
): number {
  let steering = second ? active : 0;
  if (intents.switchLamp) {
    if (second) {
      steering = steering === 0 ? 1 : 0;
      // The lamp taken over stops where it is, rather than swinging back to an old aim.
      const taken = steering === 0 ? main : second;
      taken.target = taken.angle;
      emit({ type: 'lampSwitched', tick, lamp: steering });
    } else {
      emit({ type: 'abilityUnavailable', tick, ability: 'switchLamp', reason: 'locked' });
    }
  }
  const lamps: BeamState[] = second ? [main, second] : [main];
  lamps.forEach((lamp, i) => {
    if (i === steering) {
      stepBeam(lamp, intents.aimAngle, stats, feel, dt);
    } else {
      lamp.angle = wrapAngle(lamp.angle + sweepSpeed * dt);
      lamp.target = lamp.angle;
    }
  });
  return steering;
}
