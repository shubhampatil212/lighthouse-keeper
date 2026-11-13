/**
 * Background sound for each region (docs/ART_AUDIO.md "Ambience"): waves (brown noise through a
 * slowly moving low-pass, swelling every 5–9 s), wind (pink noise through a drifting band-pass),
 * rain (high-passed white noise and droplet clicks) and, now and then, gulls and a far buoy bell.
 * Changing region cross-fades the old sea into the new one.
 */
import { AMBIENCE } from '../data';
import type { AmbienceMix } from '../data/soundTypes';
import type { RegionId } from '../data/types';
import type { Buses } from './engine';
import type { Shot } from './sfx/kit';
import { buoyBell, gull } from './sfx/world';
import { filter, lfo } from './synth/filters';
import { noiseSource, startNoise } from './synth/noise';
import { noiseBurst } from './synth/voices';

export interface AmbienceLook {
  region: RegionId;
  /** The night's rain, 0–1 (WeatherDef.rain). */
  rain: number;
  /** Menus play the sea a little quieter. */
  menu: boolean;
}

interface Running {
  group: GainNode;
  /** The looping noise and LFOs, stopped when the scene changes. */
  sources: AudioScheduledSourceNode[];
  /** Audio-clock times of the next swell, gull, bell and droplet. */
  next: { swell: number; gull: number; bell: number; drop: number };
  swell: GainNode | null;
  mix: AmbienceMix;
  rain: number;
}

const LOOKAHEAD = 0.4;
const between = (min: number, max: number): number => min + Math.random() * (max - min);

export interface Ambience {
  set(look: AmbienceLook): void;
  /** Schedules swells, gulls, bells and droplets a little ahead; call a few times a second. */
  tick(): void;
}

export function createAmbience(ctx: AudioContext, buses: Buses): Ambience {
  let current: Running | null = null;
  let key = '';

  const shotFor = (run: Running, at: number): Shot => ({
    ctx,
    out: run.group,
    send: buses.sfxEcho,
    room: buses.sfxRoom,
    at,
    pitch: 1 + (Math.random() * 2 - 1) * 0.03,
    // One-shots stop themselves; only the loops need stopping on a change of scene.
    track: () => undefined,
  });

  function start(look: AmbienceLook): Running {
    const mix = AMBIENCE.regions[look.region];
    const now = ctx.currentTime;
    const group = ctx.createGain();
    group.gain.value = 0;
    group.gain.setValueAtTime(0, now);
    group.gain.linearRampToValueAtTime(look.menu ? AMBIENCE.menuLevel : 1, now + AMBIENCE.fade);
    group.connect(buses.ambience);
    const run: Running = {
      group,
      sources: [],
      next: {
        swell: now,
        gull: mix.gullsMax > 0 ? now + between(mix.gullsMin, mix.gullsMax) * 0.5 : Infinity,
        bell: mix.bellMax > 0 ? now + between(mix.bellMin, mix.bellMax) * 0.5 : Infinity,
        drop: now,
      },
      swell: null,
      mix,
      rain: look.rain,
    };
    const loop = (color: 'white' | 'pink' | 'brown', into: AudioNode): void => {
      const src = noiseSource(ctx, color);
      src.connect(into);
      startNoise(src, now);
      run.sources.push(src);
    };

    if (mix.waves.level > 0) {
      const w = mix.waves;
      const swell = ctx.createGain();
      swell.gain.value = w.level * 0.5;
      swell.connect(group);
      const mid = (w.cutoffLow + w.cutoffHigh) / 2;
      const lp = filter(ctx, 'lowpass', mid, 0.5);
      run.sources.push(lfo(ctx, lp.frequency, (w.cutoffHigh - w.cutoffLow) / 2, 0.06, now));
      lp.connect(swell);
      loop('brown', lp);
      // A little foam hiss riding on the same swells.
      const foam = filter(ctx, 'highpass', 1800, 0.5);
      const foamLevel = ctx.createGain();
      foamLevel.gain.value = 0.12;
      foam.connect(foamLevel).connect(swell);
      loop('pink', foam);
      run.swell = swell;
    }
    if (mix.wind.level > 0) {
      const w = mix.wind;
      const level = ctx.createGain();
      level.gain.value = w.level;
      run.sources.push(lfo(ctx, level.gain, w.level * 0.35, 0.09, now));
      level.connect(group);
      const band = filter(ctx, 'bandpass', (w.bandLow + w.bandHigh) / 2, w.q);
      run.sources.push(lfo(ctx, band.frequency, (w.bandHigh - w.bandLow) / 2, 0.04, now));
      band.connect(level);
      loop('pink', band);
    }
    if (look.rain > 0 && mix.rain.level > 0) {
      const level = ctx.createGain();
      level.gain.value = mix.rain.level * look.rain;
      level.connect(group);
      const hp = filter(ctx, 'highpass', 2400, 0.5);
      hp.connect(level);
      loop('white', hp);
    }
    return run;
  }

  function stop(run: Running): void {
    const now = ctx.currentTime;
    run.group.gain.cancelScheduledValues(now);
    run.group.gain.setValueAtTime(run.group.gain.value, now);
    run.group.gain.linearRampToValueAtTime(0, now + AMBIENCE.fade);
    for (const s of run.sources) {
      try {
        s.stop(now + AMBIENCE.fade + 0.1);
      } catch {
        // Already stopped.
      }
    }
    setTimeout(
      () => {
        run.group.disconnect();
      },
      (AMBIENCE.fade + 0.3) * 1000,
    );
  }

  function schedule(run: Running): void {
    const horizon = ctx.currentTime + LOOKAHEAD;
    const { mix, next } = run;
    // Waves swell up over ~2.5 s and settle back over ~3 s, every 5–9 s.
    while (run.swell && next.swell < horizon) {
      const g = run.swell.gain;
      const at = next.swell;
      const gap = between(mix.waves.swellMin, mix.waves.swellMax);
      const peak = mix.waves.level * between(0.85, 1.15);
      g.setValueAtTime(mix.waves.level * 0.5, at);
      g.linearRampToValueAtTime(peak, at + gap * 0.4);
      g.linearRampToValueAtTime(mix.waves.level * 0.45, at + gap * 0.98);
      next.swell = at + gap;
    }
    while (next.gull < horizon) {
      gull(shotFor(run, next.gull), 1);
      next.gull += between(mix.gullsMin, mix.gullsMax);
    }
    while (next.bell < horizon) {
      const shot = shotFor(run, next.bell);
      buoyBell({ ...shot, out: farOff(shot.out) }, 1);
      next.bell += between(mix.bellMin, mix.bellMax);
    }
    const dropsPerSecond = mix.rain.dropsPerSecond * run.rain;
    while (dropsPerSecond > 0 && next.drop < horizon) {
      noiseBurst(shotFor(run, next.drop), {
        color: 'white',
        at: next.drop,
        level: mix.rain.level * between(0.3, 0.9),
        attack: 0.001,
        decay: 0.015,
        type: 'bandpass',
        freq: between(2500, 6000),
        q: 3,
      });
      next.drop += -Math.log(1 - Math.random()) / dropsPerSecond;
    }
    if (dropsPerSecond <= 0) next.drop = horizon;
  }

  /** The ambient bell is far away: quieter than the gameplay buoy bell. */
  const farOff = (out: AudioNode): AudioNode => {
    const g = ctx.createGain();
    g.gain.value = 0.35;
    g.connect(out);
    return g;
  };

  return {
    set(look) {
      const nextKey = `${look.region}|${look.rain.toFixed(2)}|${String(look.menu)}`;
      if (nextKey === key) return;
      key = nextKey;
      if (current) stop(current);
      current = start(look);
    },
    tick() {
      if (current) schedule(current);
    },
  };
}
