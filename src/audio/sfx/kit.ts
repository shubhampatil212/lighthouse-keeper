/** What every sound-effect recipe receives, and a note helper. */
import type { Patch } from '../synth/voices';

/** A patch with a start time, the random ±3% pitch factor, and the short "room" reverb. */
export interface Shot extends Patch {
  at: number;
  pitch: number;
  room: AudioNode;
}

/** A recipe plays its sound and returns how many seconds it lasts. `n` = which star (1–3). */
export type Recipe = (shot: Shot, n: number) => number;

/** Frequency `semitones` above (or below) D5. */
export const note = (semitones: number, base = 587.33): number =>
  base * Math.pow(2, semitones / 12);

/** The same patch, but echoing into the room reverb instead of the long one. */
export const inRoom = (shot: Shot): Shot => ({ ...shot, send: shot.room });
