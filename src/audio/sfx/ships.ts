/** Ship and reef sounds (docs/ART_AUDIO.md sound effects table). All notes sit in D Dorian. */
import { bell, noiseBurst, thunk, tone } from '../synth/voices';
import { inRoom, note, type Recipe, type Shot } from './kit';

/** A soft coin clink: two bright, short partials. */
export function coin(s: Shot, at: number, level = 0.5): void {
  tone(s, { freq: note(27, 587.33) * s.pitch, at, level, decay: 0.12 });
  tone(s, { freq: note(31, 587.33) * s.pitch, at: at + 0.06, level: level * 0.8, decay: 0.18 });
}

/** Ship lit for the first time: a small two-note bell (D6 → A6). */
export const shipLit: Recipe = (s) => {
  bell(s, {
    freq: note(12) * s.pitch,
    at: s.at,
    level: 0.6,
    decay: 0.5,
    brightness: 0.6,
    echo: 0.3,
  });
  bell(s, {
    freq: note(19) * s.pitch,
    at: s.at + 0.09,
    level: 0.5,
    decay: 0.7,
    brightness: 0.6,
    echo: 0.3,
  });
  return 1.3;
};

/** Ship home: a warm chime (D, F, A rolled upward) and a soft coin clink. */
export const shipHome: Recipe = (s) => {
  [0, 3, 7, 12].forEach((semi, i) => {
    const at = s.at + i * 0.07;
    bell(s, {
      freq: note(semi) * s.pitch,
      at,
      level: 0.45,
      decay: 1.8,
      ratio: 3.5,
      brightness: 0.4,
      echo: 0.5,
    });
  });
  coin(s, s.at + 0.32, 0.35);
  return 2.6;
};

/** Reef revealed: a low "thunk" in a small room. */
export const reefRevealed: Recipe = (s) => {
  const room = inRoom(s);
  thunk(room, { freq: 62 * s.pitch, at: s.at, level: 0.9, decay: 0.45, drop: 2.2, echo: 0.7 });
  noiseBurst(room, {
    color: 'brown',
    at: s.at,
    level: 0.35,
    attack: 0.002,
    decay: 0.12,
    type: 'lowpass',
    freq: 380,
  });
  return 1.2;
};

/** Wreck: wood cracks, a low rumble, then a far-off bell. */
export const wreck: Recipe = (s) => {
  const room = inRoom(s);
  noiseBurst(room, {
    color: 'white',
    at: s.at,
    level: 0.7,
    attack: 0.001,
    decay: 0.1,
    type: 'bandpass',
    freq: 1700 * s.pitch,
    q: 1.6,
    echo: 0.6,
  });
  noiseBurst(room, {
    color: 'white',
    at: s.at + 0.05,
    level: 0.45,
    attack: 0.001,
    decay: 0.16,
    type: 'bandpass',
    freq: 900 * s.pitch,
    q: 1.2,
    echo: 0.6,
  });
  noiseBurst(room, {
    color: 'white',
    at: s.at + 0.13,
    level: 0.3,
    attack: 0.001,
    decay: 0.08,
    type: 'highpass',
    freq: 2400,
  });
  noiseBurst(s, {
    color: 'brown',
    at: s.at + 0.02,
    level: 0.9,
    attack: 0.05,
    decay: 1.8,
    type: 'lowpass',
    freq: 150,
    q: 0.9,
  });
  thunk(s, { freq: 45 * s.pitch, at: s.at + 0.02, level: 0.5, decay: 1.2, drop: 1.6 });
  bell(s, {
    freq: note(-12) * s.pitch,
    at: s.at + 0.5,
    level: 0.22,
    decay: 2.8,
    ratio: 2.76,
    brightness: 1,
    echo: 0.9,
  });
  return 4;
};

/** A smuggler caught: a pleased little two-note chime and a coin. */
export const smugglerCaught: Recipe = (s) => {
  bell(s, {
    freq: note(3) * s.pitch,
    at: s.at,
    level: 0.45,
    decay: 0.9,
    ratio: 3.5,
    brightness: 0.5,
    echo: 0.4,
  });
  bell(s, {
    freq: note(10) * s.pitch,
    at: s.at + 0.1,
    level: 0.45,
    decay: 1.1,
    ratio: 3.5,
    brightness: 0.5,
    echo: 0.4,
  });
  coin(s, s.at + 0.25, 0.35);
  return 1.8;
};
