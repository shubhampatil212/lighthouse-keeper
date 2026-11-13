/**
 * Storm Strait's weather (docs/CONTENT.md §3, region 3): lightning lights the whole map for a moment
 * after a short warning glow, and storm waves push every ship in a direction that changes every 10 s.
 * Both draw from the night's hazard random stream, so a seed always gives the same storm.
 */
import type { LightningConfig, StormWavesConfig } from '../data/types';
import type { Emit } from './events';
import type { Rng } from './rng';

export interface LightningState {
  /** Seconds until the next strike. */
  timer: number;
  /** True once this strike's warning glow has started. */
  warned: boolean;
}

export interface WavesState {
  /** Direction the waves push (radians). */
  angle: number;
  /** Seconds until they change direction. */
  timer: number;
}

export function startLightning(rng: Rng, config: LightningConfig): LightningState {
  return { timer: rng.range(config.intervalMin, config.intervalMax), warned: false };
}

export function startWaves(rng: Rng, config: StormWavesConfig): WavesState {
  return { angle: rng.range(-Math.PI, Math.PI), timer: config.period };
}

/** Returns the seconds of map-wide light a strike adds this tick (0 if none). */
export function stepLightning(
  state: LightningState,
  rng: Rng,
  config: LightningConfig,
  dt: number,
  tick: number,
  emit: Emit,
): number {
  state.timer -= dt;
  if (!state.warned && state.timer <= config.warning) {
    state.warned = true;
    emit({ type: 'lightningWarning', tick, inSeconds: Math.max(0, state.timer) });
  }
  if (state.timer > 0) return 0;
  state.timer = rng.range(config.intervalMin, config.intervalMax);
  state.warned = false;
  emit({ type: 'lightning', tick });
  return config.flash;
}

export function stepWaves(
  state: WavesState,
  rng: Rng,
  config: StormWavesConfig,
  dt: number,
  tick: number,
  emit: Emit,
): void {
  state.timer -= dt;
  if (state.timer > 0) return;
  state.timer = config.period;
  state.angle = rng.range(-Math.PI, Math.PI);
  emit({ type: 'wavesShifted', tick, angle: state.angle });
}
