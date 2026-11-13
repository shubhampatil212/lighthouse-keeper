/** Menu sounds: soft clicks for tap and back, a coin for buying, a rising chime per star. */
import { bell, noiseBurst, tone } from '../synth/voices';
import { note, type Recipe } from './kit';
import { coin } from './ships';

export const uiTap: Recipe = (s) => {
  tone(s, { freq: 880 * s.pitch, at: s.at, level: 0.35, decay: 0.05 });
  noiseBurst(s, {
    color: 'white',
    at: s.at,
    level: 0.25,
    attack: 0.001,
    decay: 0.02,
    type: 'bandpass',
    freq: 2600,
    q: 1.5,
  });
  return 0.2;
};

export const uiBack: Recipe = (s) => {
  tone(s, { freq: 587 * s.pitch, at: s.at, level: 0.35, decay: 0.06 });
  noiseBurst(s, {
    color: 'white',
    at: s.at,
    level: 0.22,
    attack: 0.001,
    decay: 0.02,
    type: 'bandpass',
    freq: 1800,
    q: 1.5,
  });
  return 0.2;
};

export const uiBuy: Recipe = (s, n) => {
  uiTap(s, n);
  coin(s, s.at + 0.05, 0.6);
  return 0.6;
};

/** Each star's chime starts one scale step higher than the last (D, E, F → up a fifth). */
const STAR_STEPS = [0, 2, 3];

export const star: Recipe = (s, n) => {
  const base = STAR_STEPS[Math.max(0, Math.min(2, n - 1))] ?? 0;
  [0, 7, 12].forEach((semi, i) => {
    bell(s, {
      freq: note(base + semi) * s.pitch,
      at: s.at + i * 0.08,
      level: 0.5 - i * 0.08,
      decay: 1.2,
      ratio: 3.5,
      brightness: 0.5,
      echo: 0.5,
    });
  });
  return 1.8;
};
