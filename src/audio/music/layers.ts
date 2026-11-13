/**
 * What the music plays on each beat: the night's calm layer (pad + sparse plucked melody), its
 * tension layer (low pulse + high strings), the title theme, and the dawn and fail motifs.
 * Generative, but every note comes from D Dorian (theory.ts).
 */
import { MUSIC } from '../../data';
import { bell, pad, pluck, tone, type Patch } from '../synth/voices';
import { chordAt, degreeSemis, freq, walk } from './theory';

const BEATS_PER_BAR = 4;
/** Melody range in scale degrees above D3: A3 … A4 for the night, D4 … D5 for the title. */
const NIGHT_LOW = 4;
const NIGHT_HIGH = 11;

export interface Beat {
  /** Beats since the layer started. */
  index: number;
  at: number;
  /** Seconds per beat. */
  length: number;
}

export interface MelodyState {
  degree: number;
}

const chordChange = (b: Beat): boolean => b.index % (BEATS_PER_BAR * MUSIC.barsPerChord) === 0;
const barOf = (b: Beat): number => Math.floor(b.index / BEATS_PER_BAR);

function chordPad(p: Patch, b: Beat, level: number, cutoff: number, shift = 0): void {
  const chordBeats = BEATS_PER_BAR * MUSIC.barsPerChord;
  const attack = b.length * 2;
  const release = b.length * 3;
  pad(p, {
    freqs: chordAt(barOf(b)).map((semi) => freq(semi + shift)),
    at: b.at,
    attack,
    hold: Math.max(0.1, chordBeats * b.length - attack),
    release,
    level,
    cutoff,
    echo: 0.6,
  });
}

/** Calm layer: a slow pad, and on some beats a soft plucked note. */
export function calmBeat(p: Patch, b: Beat, melody: MelodyState): void {
  const { calm } = MUSIC;
  if (chordChange(b)) chordPad(p, b, calm.pad, 900);
  const strong = b.index % BEATS_PER_BAR === 0;
  // Leave the first beat of each chord to the pad, and breathe: never two bars without a rest.
  if (chordChange(b) || Math.random() > calm.melodyChance * (strong ? 1.3 : 1)) return;
  melody.degree = walk(melody.degree, chordAt(barOf(b)), strong, NIGHT_LOW, NIGHT_HIGH);
  const semi = degreeSemis(melody.degree);
  pluck(p, { freq: freq(semi), at: b.at, level: calm.melody, decay: b.length * 2.2, echo: 0.7 });
  // Sometimes a quiet echo note half a beat later, a step lower.
  if (Math.random() < 0.2) {
    const echoNote = degreeSemis(melody.degree - 1);
    pluck(p, {
      freq: freq(echoNote),
      at: b.at + b.length / 2,
      level: calm.melody * 0.6,
      decay: b.length * 1.8,
      echo: 0.7,
    });
  }
}

/** Tension layer: a soft low pulse on every eighth note and high, thin strings on each chord. */
export function tensionBeat(p: Patch, b: Beat): void {
  const { tension } = MUSIC;
  const root = (chordAt(barOf(b))[0] ?? 0) - 12;
  for (let half = 0; half < 2; half++) {
    const accent = half === 0 && b.index % 2 === 0;
    tone(p, {
      freq: freq(root),
      at: b.at + (half * b.length) / 2,
      level: tension.pulse * (accent ? 1 : 0.6),
      attack: 0.01,
      decay: b.length * 0.45,
      type: 'triangle',
    });
  }
  if (chordChange(b)) chordPad(p, b, tension.strings, 2600, 24);
}

/** Title theme: the same voices, slower; a remembered phrase, then a looser answer. */
export function titleBeat(p: Patch, b: Beat, melody: MelodyState): void {
  if (chordChange(b)) chordPad(p, b, MUSIC.calm.pad * 0.9, 700);
  const phrase = MUSIC.titlePhrase;
  const inPhrase = b.index % (phrase.length * 2);
  if (inPhrase < phrase.length) {
    let semi = phrase[inPhrase] ?? null;
    if (semi === null) return;
    // A little variation each time round: now and then a neighboring scale note instead.
    if (Math.random() < 0.15) semi += Math.random() < 0.5 ? 2 : -2;
    const level = MUSIC.calm.melody * 1.1;
    bell(p, {
      freq: freq(semi + 12),
      at: b.at,
      level: level * 0.5,
      decay: b.length * 2.5,
      ratio: 3.5,
      brightness: 0.3,
      echo: 0.8,
    });
    pluck(p, { freq: freq(semi), at: b.at, level, decay: b.length * 2.5, echo: 0.8 });
    melody.degree = 9;
    return;
  }
  calmBeat(p, b, melody);
}

/** Dawn on the results screen, or the darker fail version: a short motif over a held chord. */
export function motif(p: Patch, at: number, failed: boolean): number {
  const m = failed ? MUSIC.fail : MUSIC.dawn;
  const shift = failed ? -12 : 12;
  m.notes.forEach((semi, i) => {
    const t = at + i * m.step;
    if (failed)
      pluck(p, { freq: freq(semi + shift + 12), at: t, level: m.level, decay: 1.6, echo: 0.8 });
    else
      bell(p, {
        freq: freq(semi + shift),
        at: t,
        level: m.level,
        decay: 2.2,
        ratio: 3.5,
        brightness: 0.4,
        echo: 0.8,
      });
  });
  const length = m.notes.length * m.step;
  pad(p, {
    freqs: (failed ? [-12, -5, 3] : [0, 7, 14]).map(freq),
    at,
    attack: 0.8,
    hold: length,
    release: 2.5,
    level: m.level * 0.6,
    cutoff: failed ? 500 : 1100,
    echo: 0.7,
  });
  return length + 3.5;
}
