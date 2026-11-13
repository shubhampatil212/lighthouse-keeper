/**
 * The AudioEngine: one AudioContext, made on the player's first tap or key press (browsers block
 * sound before that, and making it earlier prints a console warning). Buses: master (with a light
 * compressor) ← music, sfx, ambience, each with its own volume. Suspends while the tab is hidden.
 * Sound effects play as limited "voices" so a busy night never piles up sound.
 */
import { AUDIO } from '../data';
import type { SfxId } from '../data/soundTypes';
import type { GameSettings } from '../data/uiTypes';
import { glide } from './synth/envelope';
import { panner } from './synth/filters';
import { createReverb } from './synth/reverb';
import type { Patch } from './synth/voices';

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

/** One playing sound effect. `pitch` is its random ±3% factor; `at` is when it starts. */
export interface Voice extends Patch {
  ctx: AudioContext;
  at: number;
  pitch: number;
  /** The short reverb (a small "room" around thunks and cracks). */
  room: AudioNode;
  /** Frees the voice after `seconds` (when its last sound has faded). */
  endAfter(seconds: number): void;
}

export interface AudioEngine {
  /** Null until the first tap or key press. */
  readonly ctx: AudioContext | null;
  readonly buses: Buses | null;
  /** Runs `start` once sound is available (at once if it already is). */
  whenReady(start: (ctx: AudioContext, buses: Buses) => void): void;
  setVolumes(settings: GameSettings): void;
  /** A voice for one sound effect, or null when it's rate-limited or every voice is busier. */
  voice(id: SfxId, pan?: number): Voice | null;
  duckMusic(): void;
  /** Loudness of each bus in dBFS (−100 when silent), for the sound test meters. */
  meters(): Record<BusName, number>;
  readonly activeVoices: number;
}

interface Playing {
  id: SfxId;
  priority: number;
  out: GainNode;
  sources: AudioScheduledSourceNode[];
  timer: number;
  done: boolean;
}

const curve = (value: number): number =>
  Math.pow(Math.max(0, Math.min(100, value)) / 100, AUDIO.volumeCurve);

function buildBuses(ctx: AudioContext): Buses {
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

const duckNodes = new WeakMap<Buses, GainNode>();
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'] as const;

export function createAudioEngine(win: Window = window): AudioEngine {
  let ctx: AudioContext | null = null;
  let buses: Buses | null = null;
  let settings: GameSettings | null = null;
  const waiting: ((ctx: AudioContext, buses: Buses) => void)[] = [];
  const playing: Playing[] = [];
  const lastStart = new Map<SfxId, number>();
  const analysers = new Map<BusName, AnalyserNode>();
  const meterData = new Float32Array(512);

  const applyVolumes = (): void => {
    if (!ctx || !buses || !settings) return;
    const now = ctx.currentTime;
    const s = settings;
    glide(buses.master.gain, s.muted ? 0 : curve(s.master), now, AUDIO.volumeRamp);
    glide(buses.music.gain, AUDIO.busLevel.music * curve(s.music), now, AUDIO.volumeRamp);
    glide(buses.sfx.gain, AUDIO.busLevel.sfx * curve(s.effects), now, AUDIO.volumeRamp);
    glide(buses.ambience.gain, AUDIO.busLevel.ambience * curve(s.ambience), now, AUDIO.volumeRamp);
  };

  const unlock = (event: Event): void => {
    // Esc isn't a "user activation" for the browser, so it can't start sound.
    if (event instanceof KeyboardEvent && event.key === 'Escape') return;
    if (!ctx) {
      try {
        ctx = new AudioContext({ latencyHint: 'interactive' });
      } catch {
        removeGestures();
        return;
      }
      buses = buildBuses(ctx);
      buses.master.gain.value = 0;
      applyVolumes();
      // iOS only opens the audio output after something plays inside the gesture.
      const blip = ctx.createBufferSource();
      blip.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      blip.connect(ctx.destination);
      blip.start();
      const ready = ctx;
      const readyBuses = buses;
      for (const start of waiting.splice(0)) start(ready, readyBuses);
    }
    if (ctx.state === 'suspended' && !win.document.hidden) void ctx.resume();
    if (ctx.state === 'running') removeGestures();
  };
  const removeGestures = (): void => {
    for (const type of GESTURES) win.removeEventListener(type, unlock, true);
  };
  for (const type of GESTURES) win.addEventListener(type, unlock, true);

  win.document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (win.document.hidden) void ctx.suspend();
    else void ctx.resume();
  });

  const release = (p: Playing): void => {
    if (p.done) return;
    p.done = true;
    win.clearTimeout(p.timer);
    p.out.disconnect();
    const index = playing.indexOf(p);
    if (index >= 0) playing.splice(index, 1);
  };

  /** Fades a voice out over 30 ms and stops its sources, to make room for a more important one. */
  const steal = (p: Playing, now: number): void => {
    glide(p.out.gain, 0, now, 0.03);
    for (const s of p.sources) {
      try {
        s.stop(now + 0.04);
      } catch {
        // Already stopped.
      }
    }
    p.done = true;
    win.clearTimeout(p.timer);
    p.timer = win.setTimeout(() => {
      p.out.disconnect();
    }, 80);
    playing.splice(playing.indexOf(p), 1);
  };

  return {
    get ctx() {
      return ctx;
    },
    get buses() {
      return buses;
    },
    whenReady(start) {
      if (ctx && buses) start(ctx, buses);
      else waiting.push(start);
    },
    setVolumes(next) {
      settings = next;
      applyVolumes();
    },
    voice(id, pan = 0) {
      if (!ctx || !buses || ctx.state !== 'running') return null;
      const def = AUDIO.sfx[id];
      const nowMs = performance.now();
      if (nowMs - (lastStart.get(id) ?? -Infinity) < def.minGapMs) return null;
      const now = ctx.currentTime;
      if (playing.length >= AUDIO.voiceLimit) {
        const victim = playing.find((p) => p.priority <= def.priority);
        if (!victim) return null;
        steal(victim, now);
      }
      lastStart.set(id, nowMs);
      const out = ctx.createGain();
      out.gain.value = def.level;
      if (pan !== 0) out.connect(panner(ctx, pan)).connect(buses.sfx);
      else out.connect(buses.sfx);
      const entry: Playing = {
        id,
        priority: def.priority,
        out,
        sources: [],
        timer: 0,
        done: false,
      };
      playing.push(entry);
      if (def.ducksMusic) this.duckMusic();
      const v = AUDIO.pitchVariation;
      return {
        ctx,
        out,
        send: buses.sfxEcho,
        room: buses.sfxRoom,
        at: now + 0.005,
        pitch: 1 + (Math.random() * 2 - 1) * v,
        track(source) {
          entry.sources.push(source);
        },
        endAfter(seconds) {
          entry.timer = win.setTimeout(
            () => {
              release(entry);
            },
            seconds * 1000 + 100,
          );
        },
      };
    },
    duckMusic() {
      if (!ctx || !buses) return;
      const duck = duckNodes.get(buses);
      if (!duck) return;
      const d = AUDIO.duck;
      const now = ctx.currentTime;
      duck.gain.cancelScheduledValues(now);
      duck.gain.setValueAtTime(duck.gain.value, now);
      duck.gain.linearRampToValueAtTime(d.level, now + d.attack);
      duck.gain.setValueAtTime(d.level, now + d.attack + d.hold);
      duck.gain.linearRampToValueAtTime(1, now + d.attack + d.hold + d.release);
    },
    meters() {
      const out: Record<BusName, number> = { master: -100, music: -100, sfx: -100, ambience: -100 };
      if (!ctx || !buses) return out;
      for (const name of ['master', 'music', 'sfx', 'ambience'] as const) {
        let analyser = analysers.get(name);
        if (!analyser) {
          analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          buses[name].connect(analyser);
          analysers.set(name, analyser);
        }
        analyser.getFloatTimeDomainData(meterData);
        let sum = 0;
        for (const x of meterData) sum += x * x;
        const rms = Math.sqrt(sum / meterData.length);
        out[name] = rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100;
      }
      return out;
    },
    get activeVoices() {
      return playing.length;
    },
  };
}
