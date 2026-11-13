/**
 * Synth voices every sound is built from: tones, FM bells, soft plucks, pads, a horn, filtered noise
 * bursts and a low thunk. Each one plays into a `Patch` and stops its own oscillators when done.
 */
import { pluckEnvelope, pluckLength, swellEnvelope } from './envelope';
import { filter } from './filters';
import { noiseSource, startNoise, type NoiseColor } from './noise';

/** Where a voice plays: its context, its output, an optional reverb send, and a hook to track sources. */
export interface Patch {
  ctx: BaseAudioContext;
  out: AudioNode;
  /** Reverb input, if this sound should echo. */
  send?: AudioNode | undefined;
  /** Called with every source started, so a stolen voice can stop them early. */
  track(source: AudioScheduledSourceNode): void;
}

function envGain(p: Patch, sendLevel = 0): GainNode {
  const gain = p.ctx.createGain();
  gain.gain.value = 0;
  gain.connect(p.out);
  if (p.send && sendLevel > 0) {
    const send = p.ctx.createGain();
    send.gain.value = sendLevel;
    gain.connect(send).connect(p.send);
  }
  return gain;
}

function osc(
  p: Patch,
  type: OscillatorType,
  freq: number,
  at: number,
  stop: number,
): OscillatorNode {
  const node = p.ctx.createOscillator();
  node.type = type;
  node.frequency.value = freq;
  node.start(at);
  node.stop(stop);
  p.track(node);
  return node;
}

export interface ToneOptions {
  freq: number;
  at: number;
  level: number;
  attack?: number;
  decay: number;
  type?: OscillatorType;
  /** Reverb send, 0–1. */
  echo?: number;
}

/** One oscillator with a pluck envelope. */
export function tone(p: Patch, o: ToneOptions): void {
  const attack = o.attack ?? 0.005;
  const gain = envGain(p, o.echo);
  pluckEnvelope(gain.gain, o.at, o.level, attack, o.decay);
  osc(p, o.type ?? 'sine', o.freq, o.at, o.at + pluckLength(attack, o.decay)).connect(gain);
}

/** An FM bell: a sine carrier whose tone is brightened by an inharmonic modulator that fades first. */
export function bell(p: Patch, o: ToneOptions & { ratio?: number; brightness?: number }): void {
  const attack = o.attack ?? 0.004;
  const end = o.at + pluckLength(attack, o.decay);
  const gain = envGain(p, o.echo);
  pluckEnvelope(gain.gain, o.at, o.level, attack, o.decay);
  const carrier = osc(p, 'sine', o.freq, o.at, end);
  const mod = osc(p, 'sine', o.freq * (o.ratio ?? 1.4), o.at, end);
  const depth = p.ctx.createGain();
  pluckEnvelope(depth.gain, o.at, o.freq * (o.brightness ?? 1.2), attack, o.decay * 0.35);
  mod.connect(depth).connect(carrier.frequency);
  carrier.connect(gain);
}

/** A soft plucked string: triangle + octave sine through a low-pass that closes quickly. */
export function pluck(p: Patch, o: ToneOptions): void {
  const attack = o.attack ?? 0.006;
  const end = o.at + pluckLength(attack, o.decay);
  const gain = envGain(p, o.echo);
  pluckEnvelope(gain.gain, o.at, o.level, attack, o.decay);
  const lp = filter(p.ctx, 'lowpass', o.freq * 6, 0.5);
  lp.frequency.setValueAtTime(o.freq * 6, o.at);
  lp.frequency.setTargetAtTime(o.freq * 1.5, o.at, o.decay / 5);
  lp.connect(gain);
  osc(p, 'triangle', o.freq, o.at, end).connect(lp);
  const octave = p.ctx.createGain();
  octave.gain.value = 0.3;
  osc(p, 'sine', o.freq * 2, o.at, end)
    .connect(octave)
    .connect(lp);
}

export interface PadOptions {
  freqs: readonly number[];
  at: number;
  /** Seconds at full level, between attack and release. */
  hold: number;
  level: number;
  attack: number;
  release: number;
  cutoff: number;
  echo?: number;
  type?: OscillatorType;
  /** Detune between the two oscillators of each note, in cents. */
  spread?: number;
}

/** Warm sustained chord: two detuned oscillators per note through a gentle low-pass. */
export function pad(p: Patch, o: PadOptions): void {
  const end = o.at + o.attack + o.hold + o.release + 0.05;
  const gain = envGain(p, o.echo);
  swellEnvelope(gain.gain, o.at, o.level / Math.sqrt(o.freqs.length), o.attack, o.hold, o.release);
  const lp = filter(p.ctx, 'lowpass', o.cutoff, 0.6);
  lp.connect(gain);
  const spread = o.spread ?? 7;
  for (const freq of o.freqs) {
    for (const cents of [-spread, spread]) {
      const node = osc(p, o.type ?? 'sawtooth', freq, o.at, end);
      node.detune.value = cents;
      const half = p.ctx.createGain();
      half.gain.value = 0.5;
      node.connect(half).connect(lp);
    }
  }
}

/** A deep horn: three detuned saws whose low-pass opens as it sounds (the foghorn, the pirate horn). */
export function horn(
  p: Patch,
  o: { freq: number; at: number; hold: number; level: number; cutoff: number },
): void {
  const attack = 0.12;
  const release = 0.4;
  const end = o.at + attack + o.hold + release + 0.05;
  const gain = envGain(p, 0.5);
  swellEnvelope(gain.gain, o.at, o.level, attack, o.hold, release);
  const lp = filter(p.ctx, 'lowpass', o.cutoff * 0.4, 1.1);
  lp.frequency.setValueAtTime(o.cutoff * 0.4, o.at);
  lp.frequency.linearRampToValueAtTime(o.cutoff, o.at + attack + 0.15);
  lp.frequency.linearRampToValueAtTime(o.cutoff * 0.5, end);
  lp.connect(gain);
  for (const cents of [-9, 0, 8]) {
    const node = osc(p, 'sawtooth', o.freq, o.at, end);
    node.detune.value = cents;
    node.connect(lp);
  }
}

export interface NoiseBurstOptions {
  color: NoiseColor;
  at: number;
  level: number;
  attack: number;
  decay: number;
  type: BiquadFilterType;
  freq: number;
  q?: number;
  /** Filter frequency to sweep to over the sound (whooshes). */
  sweepTo?: number;
  echo?: number;
}

/** Filtered noise with a pluck envelope: cracks, splashes, whooshes, clicks, rumbles. */
export function noiseBurst(p: Patch, o: NoiseBurstOptions): void {
  const end = o.at + pluckLength(o.attack, o.decay);
  const gain = envGain(p, o.echo);
  pluckEnvelope(gain.gain, o.at, o.level, o.attack, o.decay);
  const f = filter(p.ctx, o.type, o.freq, o.q ?? 0.8);
  if (o.sweepTo !== undefined) {
    f.frequency.setValueAtTime(o.freq, o.at);
    f.frequency.exponentialRampToValueAtTime(o.sweepTo, end);
  }
  f.connect(gain);
  const source = noiseSource(p.ctx, o.color);
  source.connect(f);
  startNoise(source, o.at);
  source.stop(end);
  p.track(source);
}

/** A low "thunk": a sine that drops in pitch as it fades (reef revealed, lamp switch). */
export function thunk(p: Patch, o: ToneOptions & { drop?: number }): void {
  const attack = o.attack ?? 0.003;
  const end = o.at + pluckLength(attack, o.decay);
  const gain = envGain(p, o.echo);
  pluckEnvelope(gain.gain, o.at, o.level, attack, o.decay);
  const node = osc(p, o.type ?? 'sine', o.freq * (o.drop ?? 2), o.at, end);
  node.frequency.exponentialRampToValueAtTime(o.freq, o.at + 0.08);
  node.connect(gain);
}
