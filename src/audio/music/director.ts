/**
 * The music director (docs/ART_AUDIO.md): the title theme, the night's calm and tension layers
 * (cross-fading over 1.5 s), and the dawn and fail motifs on the results screen. Notes are
 * scheduled a little ahead on the audio clock, so timing stays steady even if a frame is slow.
 */
import { MUSIC } from '../../data';
import type { Buses } from '../engine';
import { glide } from '../synth/envelope';
import type { Patch } from '../synth/voices';
import { calmBeat, motif, tensionBeat, titleBeat, type Beat, type MelodyState } from './layers';

export type MusicMode = 'silent' | 'title' | 'night' | 'dawn' | 'fail';

export interface MusicDirector {
  setMode(mode: MusicMode): void;
  readonly mode: MusicMode;
  /** The night's tension layer on or off (a ship lost in the dark or near a reef). */
  setTension(on: boolean): void;
  readonly tension: boolean;
  /** Pause dims the night's music. */
  setPaused(on: boolean): void;
  /** Schedules the next notes; call a few times a second. */
  tick(): void;
}

const LOOKAHEAD = 0.4;
/** While tense the calm layer steps back a little, so the cross-fade is heard. */
const CALM_UNDER_TENSION = 0.65;

interface Clock {
  next: number;
  index: number;
  bpm: number;
}

export function createMusicDirector(ctx: AudioContext, buses: Buses): MusicDirector {
  const group = (): GainNode => {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(buses.music);
    return g;
  };
  const patch = (out: AudioNode): Patch => ({
    ctx,
    out,
    send: buses.musicEcho,
    track: () => undefined,
  });
  const title = group();
  const night = group();
  const motifs = group();
  const calm = ctx.createGain();
  const tense = ctx.createGain();
  calm.connect(night);
  tense.connect(night);
  tense.gain.value = 0;
  const titlePatch = patch(title);
  const calmPatch = patch(calm);
  const tensePatch = patch(tense);
  const motifPatch = patch(motifs);
  const melody: MelodyState = { degree: 7 };

  let mode: MusicMode = 'silent';
  let tension = false;
  let paused = false;
  /** When the tension layer last faded out: it keeps playing until the fade is done. */
  let tenseUntil = 0;
  let clock: Clock | null = null;

  const startClock = (bpm: number): Clock => ({ next: ctx.currentTime + 0.15, index: 0, bpm });

  const applyNightLevels = (): void => {
    const now = ctx.currentTime;
    glide(tense.gain, tension ? 1 : 0, now, MUSIC.crossfade);
    glide(calm.gain, tension ? CALM_UNDER_TENSION : 1, now, MUSIC.crossfade);
    if (mode === 'night') glide(night.gain, paused ? MUSIC.pausedLevel : 1, now, 0.4);
  };

  return {
    get mode() {
      return mode;
    },
    get tension() {
      return tension;
    },
    setMode(next) {
      if (next === mode && next !== 'dawn' && next !== 'fail') return;
      const now = ctx.currentTime;
      const fade = MUSIC.modeFade;
      const previous = mode;
      mode = next;
      paused = false;
      glide(title.gain, next === 'title' ? 1 : 0, now, fade);
      glide(night.gain, next === 'night' ? 1 : 0, now, next === 'night' ? fade : fade / 2);
      if (next === 'title' && previous !== 'title') clock = startClock(MUSIC.titleBpm);
      else if (next === 'night') {
        clock = startClock(MUSIC.bpm);
        tension = false;
        tenseUntil = 0;
        applyNightLevels();
      } else if (next === 'dawn' || next === 'fail') {
        clock = null;
        motifs.gain.cancelScheduledValues(now);
        motifs.gain.setValueAtTime(1, now);
        motif(motifPatch, now + 0.3, next === 'fail');
      } else if (next === 'silent') clock = null;
    },
    setTension(on) {
      if (on === tension) return;
      tension = on;
      if (!on) tenseUntil = ctx.currentTime + MUSIC.crossfade * 1.5;
      if (mode === 'night') applyNightLevels();
    },
    setPaused(on) {
      if (on === paused) return;
      paused = on;
      if (mode === 'night') applyNightLevels();
    },
    tick() {
      if (!clock) return;
      const horizon = ctx.currentTime + LOOKAHEAD;
      // After a long stall (tab asleep), skip ahead rather than playing a burst of old notes.
      if (clock.next < ctx.currentTime - 1) clock.next = ctx.currentTime + 0.05;
      while (clock.next < horizon) {
        const beat: Beat = { index: clock.index, at: clock.next, length: 60 / clock.bpm };
        if (mode === 'title') titleBeat(titlePatch, beat, melody);
        else if (mode === 'night') {
          calmBeat(calmPatch, beat, melody);
          if (tension || beat.at < tenseUntil) tensionBeat(tensePatch, beat);
        }
        clock.next += beat.length;
        clock.index += 1;
      }
    },
  };
}
