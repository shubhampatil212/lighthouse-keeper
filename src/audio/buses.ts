/**
 * The mixer: master (through a gentle compressor) with music, effects and ambience buses, each effect
 * and music bus with reverb sends, and the music's duck stage. Volumes 0–100 map to gain on a curve.
 */
import { AUDIO } from '../data';
import { createReverb } from './synth/reverb';

export type BusName = 'master' | 'music' | 'sfx' | 'ambience';

export interface Buses {
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  ambience: GainNode;
  /** Reverb inputs: the long one for music, and long and short ones for effects. */
  musicEcho: AudioNode;
  sfxEcho: AudioNode;
  sfxRoom: AudioNode;
}

const duckNodes = new WeakMap<Buses, GainNode>();

export const curve = (value: number): number =>
  Math.pow(Math.max(0, Math.min(100, value)) / 100, AUDIO.volumeCurve);

export function buildBuses(ctx: AudioContext): Buses {
  const c = AUDIO.compressor;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = c.thresholdDb;
  comp.knee.value = c.kneeDb;
  comp.ratio.value = c.ratio;
  comp.attack.value = c.attack;
  comp.release.value = c.release;
  const master = ctx.createGain();
  master.connect(comp).connect(ctx.destination);
  const music = ctx.createGain();
  const duck = ctx.createGain();
  duck.gain.value = 1;
  music.connect(duck).connect(master);
  const sfx = ctx.createGain();
  sfx.connect(master);
  const ambience = ctx.createGain();
  ambience.connect(master);
  const echo = (into: AudioNode, seconds: number): AudioNode => {
    const reverb = createReverb(ctx, seconds);
    const level = ctx.createGain();
    level.gain.value = AUDIO.reverbSend;
    reverb.connect(level).connect(into);
    return reverb;
  };
  const buses: Buses = {
    master,
    music,
    sfx,
    ambience,
    musicEcho: echo(music, AUDIO.reverbLong),
    sfxEcho: echo(sfx, AUDIO.reverbLong),
    sfxRoom: echo(sfx, AUDIO.reverbShort),
  };
  duckNodes.set(buses, duck);
  return buses;
}

/** The music's duck stage (between the music bus and the master), for ducking under big sounds. */
export function duckNode(buses: Buses): GainNode | undefined {
  return duckNodes.get(buses);
}
