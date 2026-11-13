import type { GameSettings, UiFeelConfig } from './uiTypes';

/** Menu, HUD and results timing (docs/SCREENS.md, docs/GDD.md §8). */
export const UI_FEEL: UiFeelConfig = {
  menuSweepSpeed: 0.3,
  // GDD §8: "a sky gradient sweeping from navy to soft rose over 2 seconds".
  dawnMs: 2000,
  starDelayMs: 900,
  starIntervalMs: 550,
  starHoldMs: 400,
  toastMs: 2600,
  saveDebounceMs: 400,
  announceGapMs: 1200,
  haptics: { save: 15, wreck: [30, 40, 60], star: 10 },
  // SCREENS.md's example tip: "most wrecks happened while ships were in the dark for over 6 s".
  darkTipSeconds: 6,
  tipShare: 0.5,
  lateLightSeconds: 2,
};

/**
 * Settings a new player starts with. Reduced motion is replaced at boot by the device's own
 * setting; quality starts on Auto (docs/ART_AUDIO.md).
 */
export const DEFAULT_SETTINGS: GameSettings = {
  master: 80,
  music: 70,
  effects: 80,
  ambience: 60,
  muted: false,
  quality: 'auto',
  showFps: false,
  screenShake: true,
  difficulty: 'keeper',
  beamControl: 'follow',
  leftHanded: false,
  tutorialPrompts: true,
  reducedMotion: false,
  colorblind: false,
  highContrastReefs: false,
  largerText: false,
  haptics: true,
  installHintDismissed: false,
};
