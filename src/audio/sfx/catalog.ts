/**
 * Every sound effect by id, with the name the sound test page shows. `playSfx` gives each one a
 * limited voice, its ±3% pitch, and a left/right position.
 */
import type { SfxId } from '../../data/soundTypes';
import type { AudioEngine } from '../engine';
import type { Recipe } from './kit';
import { reefRevealed, shipHome, shipLit, smugglerCaught, wreck } from './ships';
import { star, uiBack, uiBuy, uiTap } from './ui';
import {
  abilityUnavailable,
  buoyBell,
  flare,
  foghorn,
  gull,
  lampSwitched,
  lightning,
  pirateArrived,
} from './world';

export const SOUNDS: Record<SfxId, { label: string; recipe: Recipe }> = {
  shipLit: { label: 'Ship lit', recipe: shipLit },
  shipHome: { label: 'Ship home', recipe: shipHome },
  reefRevealed: { label: 'Reef revealed', recipe: reefRevealed },
  wreck: { label: 'Wreck', recipe: wreck },
  foghorn: { label: 'Foghorn', recipe: foghorn },
  flare: { label: 'Flare', recipe: flare },
  lightning: { label: 'Lightning + thunder', recipe: lightning },
  lampSwitched: { label: 'Lamp switch', recipe: lampSwitched },
  abilityUnavailable: { label: 'Ability not ready', recipe: abilityUnavailable },
  buoyBell: { label: 'Buoy bell', recipe: buoyBell },
  smugglerCaught: { label: 'Smuggler caught', recipe: smugglerCaught },
  pirateArrived: { label: 'Pirate horn', recipe: pirateArrived },
  gull: { label: 'Gull', recipe: gull },
  uiTap: { label: 'UI tap', recipe: uiTap },
  uiBack: { label: 'UI back', recipe: uiBack },
  uiBuy: { label: 'UI buy', recipe: uiBuy },
  star: { label: 'Star', recipe: star },
};

export const SFX_IDS = Object.keys(SOUNDS) as SfxId[];

/** Plays a sound effect. `pan` is −1…1; `n` is the star number for the star chime. */
export function playSfx(engine: AudioEngine, id: SfxId, pan = 0, n = 1): void {
  const voice = engine.voice(id, pan);
  if (!voice) return;
  voice.endAfter(SOUNDS[id].recipe(voice, n));
}
