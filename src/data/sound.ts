/**
 * Sound numbers (docs/ART_AUDIO.md "Audio direction"): the mix, the voice limit, every sound
 * effect's level, the music director and each region's ambience. Values the doc doesn't give were
 * set by ear for "quiet, warm, a bit lonely" and are easy to tune here.
 */
import type { AmbienceConfig, AudioConfig, MusicConfig } from './soundTypes';

const SFX_DEFAULT = { minGapMs: 45, priority: 1, ducksMusic: false };

export const AUDIO: AudioConfig = {
  voiceLimit: 24,
  pitchVariation: 0.03,
  panWidth: 0.4,
  panRange: 230,
  volumeRamp: 0.02,
  volumeCurve: 2,
  busLevel: { music: 0.5, sfx: 0.85, ambience: 0.45 },
  compressor: { thresholdDb: -16, kneeDb: 12, ratio: 3, attack: 0.008, release: 0.25 },
  duck: { level: 0.45, attack: 0.06, hold: 0.7, release: 0.9 },
  reverbLong: 2.6,
  reverbShort: 0.7,
  reverbSend: 0.28,
  whir: { fullSpeed: 2.2, level: 0.05, lowHz: 70, highHz: 150 },
  thunderDelayMin: 0.5,
  thunderDelayMax: 2,
  sfx: {
    shipLit: { ...SFX_DEFAULT, level: 0.22, minGapMs: 90 },
    shipHome: { ...SFX_DEFAULT, level: 0.4, priority: 3, ducksMusic: true },
    reefRevealed: { ...SFX_DEFAULT, level: 0.32, minGapMs: 120 },
    wreck: { ...SFX_DEFAULT, level: 0.55, priority: 4, ducksMusic: true },
    foghorn: { ...SFX_DEFAULT, level: 0.42, priority: 3, minGapMs: 400 },
    flare: { ...SFX_DEFAULT, level: 0.34, priority: 2 },
    lightning: { ...SFX_DEFAULT, level: 0.5, priority: 3, minGapMs: 300 },
    uiTap: { ...SFX_DEFAULT, level: 0.16, minGapMs: 30 },
    uiBack: { ...SFX_DEFAULT, level: 0.16, minGapMs: 30 },
    uiBuy: { ...SFX_DEFAULT, level: 0.3, priority: 2 },
    star: { ...SFX_DEFAULT, level: 0.32, priority: 3, minGapMs: 100 },
    buoyBell: { ...SFX_DEFAULT, level: 0.24, minGapMs: 250 },
    smugglerCaught: { ...SFX_DEFAULT, level: 0.3, priority: 2 },
    pirateArrived: { ...SFX_DEFAULT, level: 0.26, priority: 2, minGapMs: 500 },
    abilityUnavailable: { ...SFX_DEFAULT, level: 0.14, minGapMs: 150 },
    lampSwitched: { ...SFX_DEFAULT, level: 0.2, minGapMs: 120 },
    gull: { ...SFX_DEFAULT, level: 0.08, priority: 0, minGapMs: 400 },
  },
};

// Semitones from D: D=0, E=2, F=3, G=5, A=7, B=9, C=10.
export const MUSIC: MusicConfig = {
  bpm: 70,
  titleBpm: 60,
  rootHz: 146.83,
  scale: [0, 2, 3, 5, 7, 9, 10],
  // Dm7 – Cadd9 – G (Dorian's bright IV) – Am7 (low).
  progression: [
    [0, 3, 7, 10],
    [-2, 2, 5, 14],
    [-7, 2, 5, 9],
    [-5, 3, 7, 10],
  ],
  barsPerChord: 2,
  crossfade: 1.5,
  calm: { pad: 0.16, melody: 0.13, melodyChance: 0.32 },
  tension: { pulse: 0.13, strings: 0.05 },
  pausedLevel: 0.35,
  modeFade: 2,
  dawn: { notes: [0, 3, 7, 12, 14], step: 0.34, level: 0.3 },
  fail: { notes: [7, 3, 2, -2, 0], step: 0.55, level: 0.26 },
  titlePhrase: [12, null, 10, 7, 9, null, 7, null, 5, 7, 3, null, 2, null, 0, null],
};

const CALM_SEA = { level: 0.5, cutoffLow: 220, cutoffHigh: 700, swellMin: 5, swellMax: 9 };

export const AMBIENCE: AmbienceConfig = {
  menuLevel: 0.7,
  fade: 2,
  regions: {
    harborBay: {
      waves: CALM_SEA,
      wind: { level: 0.12, bandLow: 500, bandHigh: 1100, q: 1.2 },
      rain: { level: 0.3, dropsPerSecond: 6 },
      gullsMin: 14,
      gullsMax: 30,
      bellMin: 25,
      bellMax: 50,
    },
    northernIce: {
      waves: { ...CALM_SEA, level: 0.35, cutoffHigh: 520 },
      wind: { level: 0.3, bandLow: 700, bandHigh: 1700, q: 2 },
      rain: { level: 0.2, dropsPerSecond: 3 },
      gullsMin: 0,
      gullsMax: 0,
      bellMin: 40,
      bellMax: 80,
    },
    stormStrait: {
      waves: { level: 0.7, cutoffLow: 300, cutoffHigh: 1000, swellMin: 5, swellMax: 7 },
      wind: { level: 0.3, bandLow: 400, bandHigh: 1300, q: 1 },
      rain: { level: 0.45, dropsPerSecond: 12 },
      gullsMin: 0,
      gullsMax: 0,
      bellMin: 30,
      bellMax: 60,
    },
    smugglersCove: {
      waves: { ...CALM_SEA, level: 0.42, cutoffHigh: 600 },
      wind: { level: 0.08, bandLow: 400, bandHigh: 900, q: 1.2 },
      rain: { level: 0.3, dropsPerSecond: 6 },
      gullsMin: 30,
      gullsMax: 60,
      bellMin: 18,
      bellMax: 35,
    },
    archipelago: {
      waves: { ...CALM_SEA, level: 0.55 },
      wind: { level: 0.16, bandLow: 500, bandHigh: 1200, q: 1.4 },
      rain: { level: 0.3, dropsPerSecond: 6 },
      gullsMin: 18,
      gullsMax: 40,
      bellMin: 25,
      bellMax: 50,
    },
  },
};
