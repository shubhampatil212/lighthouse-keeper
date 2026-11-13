/** Shapes for the sound numbers in sound.ts (docs/ART_AUDIO.md "Audio direction"). */
import type { RegionId } from './types';

/** Every sound effect the game plays. The sound test page lists them all. */
export type SfxId =
  | 'shipLit'
  | 'shipHome'
  | 'reefRevealed'
  | 'wreck'
  | 'foghorn'
  | 'flare'
  | 'lightning'
  | 'uiTap'
  | 'uiBack'
  | 'uiBuy'
  | 'star'
  | 'buoyBell'
  | 'smugglerCaught'
  | 'pirateArrived'
  | 'abilityUnavailable'
  | 'lampSwitched'
  | 'gull';

export interface SfxDef {
  /** Peak level of the sound, 0–1, before the effects slider. */
  level: number;
  /** The same sound can't start again sooner than this (milliseconds), so 20 ships can't pile up. */
  minGapMs: number;
  /** When every voice is busy, a sound with a higher priority takes the oldest lower one's place. */
  priority: number;
  /** Duck the music under this sound (the save chime and the wreck must never be covered). */
  ducksMusic: boolean;
}

export interface CompressorConfig {
  thresholdDb: number;
  kneeDb: number;
  ratio: number;
  attack: number;
  release: number;
}

export interface AudioConfig {
  /** At most this many sound-effect voices play at once. */
  voiceLimit: number;
  /** Every sound effect's pitch varies by up to ± this fraction (0.03 = ±3%). */
  pitchVariation: number;
  /** A ship at the edge of the safe radius pans this far left or right (−1…1 scale). */
  panWidth: number;
  /** Ships this far from the island (world units) pan fully to `panWidth`. */
  panRange: number;
  /** Volume changes reach their new level in about this many seconds (fast, but no click). */
  volumeRamp: number;
  /** Slider 0–100 → gain = (value / 100) ^ this, so the slider feels even to the ear. */
  volumeCurve: number;
  /** Fixed mix level of each bus under its slider. */
  busLevel: { music: number; sfx: number; ambience: number };
  compressor: CompressorConfig;
  /** Music ducking: drop to this fraction, hold, then come back. Seconds. */
  duck: { level: number; attack: number; hold: number; release: number };
  /** Seconds of the long reverb tail (music, bells) and the short one (thunks, cracks). */
  reverbLong: number;
  reverbShort: number;
  /** How loud the reverb returns are (0–1). */
  reverbSend: number;
  /** The beam's whir (High quality only): turn speed (rad/s) at full pitch and level. */
  whir: { fullSpeed: number; level: number; lowHz: number; highHz: number };
  /** Thunder follows the lightning crack after this many seconds (random between). */
  thunderDelayMin: number;
  thunderDelayMax: number;
  sfx: Record<SfxId, SfxDef>;
}

export interface MusicConfig {
  bpm: number;
  /** The title theme's slower tempo. */
  titleBpm: number;
  /** Frequency of the scale's root (D3), Hz. */
  rootHz: number;
  /** The mode's steps in semitones from the root (D Dorian). */
  scale: readonly number[];
  /** Chords as semitones from the root, each held for `barsPerChord` bars of 4 beats. */
  progression: readonly (readonly number[])[];
  barsPerChord: number;
  /** Seconds for the calm and tension layers to cross-fade. */
  crossfade: number;
  calm: { pad: number; melody: number; melodyChance: number };
  tension: { pulse: number; strings: number };
  /** Music level while the night is paused, as a fraction. */
  pausedLevel: number;
  /** Seconds each mode change fades over (title ↔ night ↔ quiet). */
  modeFade: number;
  /** Results motifs: semitones from the root and seconds between notes. */
  dawn: { notes: readonly number[]; step: number; level: number };
  fail: { notes: readonly number[]; step: number; level: number };
  /** The title theme's melody, one note per beat (semitones from the root; null = rest). */
  titlePhrase: readonly (number | null)[];
}

/** Background sound for one region, levels 0–1. A level of 0 turns the layer off. */
export interface AmbienceMix {
  waves: {
    level: number;
    cutoffLow: number;
    cutoffHigh: number;
    swellMin: number;
    swellMax: number;
  };
  wind: { level: number; bandLow: number; bandHigh: number; q: number };
  /** Multiplied by the night's rain amount (WeatherDef.rain). */
  rain: { level: number; dropsPerSecond: number };
  /** Seconds between gull calls (random between); 0 = no gulls here. */
  gullsMin: number;
  gullsMax: number;
  /** Seconds between distant buoy bells; 0 = none. */
  bellMin: number;
  bellMax: number;
}

export interface AmbienceConfig {
  regions: Record<RegionId, AmbienceMix>;
  /** Behind the menus the sea is a little quieter. */
  menuLevel: number;
  /** Seconds to cross-fade to another region's sound. */
  fade: number;
}
