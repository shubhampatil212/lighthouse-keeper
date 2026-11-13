/** Ability, weather and sea sounds: foghorn, flare, lamp switch, lightning, buoy bell, gulls, pirates. */
import { AUDIO } from '../../data';
import { glide } from '../synth/envelope';
import { bell, horn, noiseBurst, thunk, tone } from '../synth/voices';
import { inRoom, note, type Recipe } from './kit';

/** Foghorn: a deep two-tone horn (F2 then D2), detuned saws through a low-pass. */
export const foghorn: Recipe = (s) => {
  horn(s, { freq: 87.31 * s.pitch, at: s.at, hold: 0.6, level: 0.55, cutoff: 650 });
  horn(s, { freq: 73.42 * s.pitch, at: s.at + 0.85, hold: 0.9, level: 0.6, cutoff: 600 });
  return 2.8;
};

/** Flare: a rising whoosh, then a soft crackle as it burns. */
export const flare: Recipe = (s) => {
  noiseBurst(s, {
    color: 'white',
    at: s.at,
    level: 0.6,
    attack: 0.25,
    decay: 0.6,
    type: 'bandpass',
    freq: 350,
    sweepTo: 2800 * s.pitch,
    q: 1.4,
    echo: 0.3,
  });
  const room = inRoom(s);
  for (let i = 0; i < 16; i++) {
    const at = s.at + 0.3 + Math.random() * 1.3;
    noiseBurst(room, {
      color: 'white',
      at,
      level: 0.12 + Math.random() * 0.15,
      attack: 0.001,
      decay: 0.025,
      type: 'highpass',
      freq: 2500 + Math.random() * 2500,
    });
  }
  return 1.9;
};

/** Lamp switched: a mechanical clunk. */
export const lampSwitched: Recipe = (s) => {
  const room = inRoom(s);
  thunk(room, { freq: 110 * s.pitch, at: s.at, level: 0.6, decay: 0.18, drop: 1.6, echo: 0.4 });
  noiseBurst(room, {
    color: 'white',
    at: s.at,
    level: 0.3,
    attack: 0.001,
    decay: 0.04,
    type: 'bandpass',
    freq: 1100,
    q: 2,
  });
  return 0.5;
};

/** Ability not ready: a dull, quiet tick. */
export const abilityUnavailable: Recipe = (s) => {
  tone(s, { freq: 196 * s.pitch, at: s.at, level: 0.5, decay: 0.08, type: 'triangle' });
  noiseBurst(s, {
    color: 'brown',
    at: s.at,
    level: 0.3,
    attack: 0.001,
    decay: 0.04,
    type: 'lowpass',
    freq: 600,
  });
  return 0.3;
};

/** Lightning: a white crack now, thunder 0.5–2 s later. */
export const lightning: Recipe = (s) => {
  noiseBurst(s, {
    color: 'white',
    at: s.at,
    level: 0.8,
    attack: 0.001,
    decay: 0.3,
    type: 'highpass',
    freq: 1400,
    echo: 0.6,
  });
  noiseBurst(s, {
    color: 'pink',
    at: s.at + 0.01,
    level: 0.5,
    attack: 0.001,
    decay: 0.2,
    type: 'bandpass',
    freq: 700,
    q: 0.7,
  });
  const delay =
    AUDIO.thunderDelayMin + Math.random() * (AUDIO.thunderDelayMax - AUDIO.thunderDelayMin);
  const at = s.at + delay;
  noiseBurst(s, {
    color: 'brown',
    at,
    level: 1,
    attack: 0.25,
    decay: 3.2,
    type: 'lowpass',
    freq: 130,
    q: 0.8,
    echo: 0.5,
  });
  noiseBurst(s, {
    color: 'brown',
    at: at + 0.35,
    level: 0.6,
    attack: 0.1,
    decay: 2.2,
    type: 'lowpass',
    freq: 220,
    q: 0.8,
  });
  return delay + 5;
};

/** A bell buoy: a low clang that rings on across the water. */
export const buoyBell: Recipe = (s) => {
  bell(s, {
    freq: note(-7) * s.pitch,
    at: s.at,
    level: 0.55,
    decay: 2.6,
    ratio: 2.76,
    brightness: 1.4,
    echo: 0.8,
  });
  bell(s, {
    freq: note(-7) * s.pitch,
    at: s.at + 0.55,
    level: 0.25,
    decay: 2,
    ratio: 2.76,
    brightness: 1,
    echo: 0.8,
  });
  return 3.4;
};

/** A distant gull: two or three falling cries. */
export const gull: Recipe = (s) => {
  const cries = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < cries; i++) {
    const at = s.at + i * (0.28 + Math.random() * 0.1);
    const gain = s.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(s.out);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.5, at + 0.03);
    gain.gain.setTargetAtTime(0, at + 0.12, 0.05);
    const cry = s.ctx.createOscillator();
    cry.type = 'triangle';
    const high = 1700 * s.pitch * (1 - i * 0.04);
    cry.frequency.setValueAtTime(high, at);
    cry.frequency.exponentialRampToValueAtTime(high * 0.62, at + 0.22);
    const vibrato = s.ctx.createOscillator();
    vibrato.frequency.value = 28;
    const depth = s.ctx.createGain();
    depth.gain.value = 40;
    vibrato.connect(depth).connect(cry.frequency);
    cry.connect(gain);
    for (const o of [cry, vibrato]) {
      o.start(at);
      o.stop(at + 0.45);
      s.track(o);
    }
  }
  return 1.4;
};

/** A pirate ship arrives: a low, distant horn. */
export const pirateArrived: Recipe = (s) => {
  horn(s, { freq: 55 * s.pitch, at: s.at, hold: 0.7, level: 0.4, cutoff: 280 });
  return 1.6;
};

/** The beam's mechanical whir: noise and a low buzz whose level and pitch follow the turn speed. */
export interface Whir {
  set(speed: number): void;
  stop(): void;
}

export function createWhir(ctx: AudioContext, out: AudioNode): Whir {
  const w = AUDIO.whir;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(out);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = w.lowHz * 4;
  band.Q.value = 3;
  band.connect(gain);
  const buzz = ctx.createOscillator();
  buzz.type = 'sawtooth';
  buzz.frequency.value = w.lowHz;
  buzz.connect(band);
  buzz.start();
  return {
    set(speed) {
      const k = Math.min(1, Math.abs(speed) / w.fullSpeed);
      const now = ctx.currentTime;
      glide(gain.gain, w.level * k, now, 0.12);
      glide(buzz.frequency, w.lowHz + (w.highHz - w.lowHz) * k, now, 0.12);
      glide(band.frequency, (w.lowHz + (w.highHz - w.lowHz) * k) * 4, now, 0.12);
    },
    stop() {
      glide(gain.gain, 0, ctx.currentTime, 0.1);
      buzz.stop(ctx.currentTime + 0.2);
    },
  };
}
