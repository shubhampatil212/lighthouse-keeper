/** Notes in D Dorian (docs/ART_AUDIO.md): every note the music plays comes through here, so it stays in key. */
import { MUSIC } from '../../data';

/** Frequency of a note `semitones` above the root (D3). */
export const freq = (semitones: number): number => MUSIC.rootHz * Math.pow(2, semitones / 12);

/** Semitones above the root of scale degree `degree` (0 = D3, 7 = D4, −1 = C3 …). */
export function degreeSemis(degree: number): number {
  const steps = MUSIC.scale.length;
  const octave = Math.floor(degree / steps);
  const index = degree - octave * steps;
  return octave * 12 + (MUSIC.scale[index] ?? 0);
}

/** The chord at bar `bar` of the progression. */
export function chordAt(bar: number): readonly number[] {
  const { progression, barsPerChord } = MUSIC;
  return progression[Math.floor(bar / barsPerChord) % progression.length] ?? [0, 3, 7];
}

/** True if scale degree `degree` is one of the chord's notes (in any octave). */
export function inChord(degree: number, chord: readonly number[]): boolean {
  const pc = ((degreeSemis(degree) % 12) + 12) % 12;
  return chord.some((semi) => ((semi % 12) + 12) % 12 === pc);
}

/**
 * The next melody note: a small random step from `from` (mostly ±1, sometimes ±2 or a repeat),
 * kept within [low, high]. On `strong` beats it settles on the nearest chord note.
 */
export function walk(
  from: number,
  chord: readonly number[],
  strong: boolean,
  low: number,
  high: number,
): number {
  const steps = [-2, -1, -1, 0, 1, 1, 2];
  let next = from + (steps[Math.floor(Math.random() * steps.length)] ?? 0);
  if (next < low) next = low + 1;
  if (next > high) next = high - 1;
  if (strong && !inChord(next, chord)) {
    next = inChord(next + 1, chord) && next + 1 <= high ? next + 1 : next - 1;
  }
  return next;
}
