/**
 * The night's bookkeeping, used by world.ts each tick: what lights the sea, what happens to each
 * ship (home, wrecked, caught, escaped), and the end-of-night result.
 */
import { ABILITIES } from '../data/abilities';
import { BEAM_FEEL } from '../data/beam';
import { HAZARDS } from '../data/hazards';
import type { LampLight, LightOrigin, LightSources } from './beam';
import { launchTow } from './coastGuard';
import type { Emit, FailReason, LevelOutcome, LevelResult, WreckCause } from './events';
import { allShipsResolved, failReason, starsFor } from './rules';
import { stepShip, type SeaForces, type Ship } from './ships';
import type { WorldSetup, WorldState } from './worldSetup';

/** Everything that can light the sea this tick. */
export function lightSourcesOf(setup: WorldSetup, state: WorldState): LightSources {
  const lamps: LampLight[] = [
    { x: 0, y: 0, angle: state.beam.angle, glowRadius: setup.beam.glowRadius },
  ];
  const second = state.lamp2;
  if (second) {
    lamps.push({
      x: second.x,
      y: second.y,
      angle: second.angle,
      glowRadius: ABILITIES.secondLamp.glowRadius,
    });
  }
  return {
    lamps,
    stats: setup.beam,
    edgeTolerance: BEAM_FEEL.edgeTolerance,
    buoys: setup.buoys,
    mapLit: state.mapLight > 0,
    fog: state.fogBands,
    fogRangeFactor: HAZARDS.fog.rangeFactor,
  };
}

/** Ends the night and records its result. */
export function endNight(
  setup: WorldSetup,
  state: WorldState,
  emit: Emit,
  outcome: LevelOutcome,
  reason: FailReason | null,
): void {
  const bonusMet = setup.objective.isMet(state.objective, state.time);
  const result: LevelResult = {
    outcome,
    failReason: reason,
    stars: starsFor(outcome, state.wrecked, bonusMet, setup.level.stars),
    saved: state.saved,
    wrecked: state.wrecked,
    total: setup.spawns.length,
    coins: state.coins,
    caught: state.caught,
    escaped: state.escaped,
    bonusMet,
    time: state.time,
  };
  state.status = outcome;
  state.result = result;
  emit({ type: 'levelEnded', tick: state.tick, result });
}

/**
 * Ends the night once it's decided: too many wrecks (or a precious ship) fails it; every ship
 * resolved wins it. The sandbox and the backdrop never end; an endless watch ends only by failing.
 */
export function settleNight(
  setup: WorldSetup,
  state: WorldState,
  end: (outcome: LevelOutcome, reason: FailReason | null) => void,
): void {
  if (setup.endless && !setup.watch) return;
  const reason = failReason(state.wrecked, setup.difficulty.wreckAllowance, state.preciousLost);
  const resolved = state.saved + state.wrecked + state.caught + state.escaped;
  if (reason) end('failed', reason);
  else if (!setup.watch && allShipsResolved(setup.spawns.length, resolved)) end('won', null);
}

/** Counts a lost ship (a precious one fails the night). */
export function recordWreck(
  setup: WorldSetup,
  state: WorldState,
  emit: Emit,
  ship: Ship,
  cause: WreckCause,
  reefIndex: number | null,
): void {
  state.wrecked++;
  if (setup.ships.types[ship.type].precious) state.preciousLost = true;
  emit({
    type: 'shipWrecked',
    tick: state.tick,
    shipId: ship.id,
    shipType: ship.type,
    cause,
    reefIndex,
    x: ship.x,
    y: ship.y,
  });
}

/** Moves every ship one tick and settles the ones that reached the end of their story. */
export function stepAllShips(
  setup: WorldSetup,
  state: WorldState,
  emit: Emit,
  light: (x: number, y: number) => LightOrigin | null,
  dt: number,
): void {
  const sea: SeaForces = {
    pushX: state.waves ? Math.cos(state.waves.angle) * HAZARDS.stormWaves.push : 0,
    pushY: state.waves ? Math.sin(state.waves.angle) * HAZARDS.stormWaves.push : 0,
    whirlpools: state.whirlpools,
  };
  const sailing: Ship[] = [];
  for (const ship of state.ships) {
    const fate = stepShip(ship, state.rocks, light, setup.ships, dt, state.tick, emit, sea);
    const { tick } = state;
    if (fate.kind === 'saved') {
      const coins = Math.round(setup.ships.types[ship.type].coins * setup.difficulty.coinReward);
      state.saved++;
      state.coins += coins;
      emit({
        type: 'shipSaved',
        tick,
        shipId: ship.id,
        shipType: ship.type,
        coins,
        x: ship.x,
        y: ship.y,
      });
    } else if (fate.kind === 'wrecked') {
      recordWreck(setup, state, emit, ship, fate.cause, fate.reefIndex);
    } else if (fate.kind === 'caught') {
      const coins = Math.round(setup.ships.smuggler.catchBonus * setup.difficulty.coinReward);
      state.caught++;
      state.coins += coins;
      state.tows.push(launchTow(state.nextShipId++, ship, setup.ships.islandRadius));
      emit({ type: 'smugglerCaught', tick, shipId: ship.id, coins, x: ship.x, y: ship.y });
    } else if (fate.kind === 'escaped') {
      state.escaped++;
      emit({ type: 'smugglerEscaped', tick, shipId: ship.id });
    } else {
      sailing.push(ship);
    }
  }
  state.ships = sailing;
}
