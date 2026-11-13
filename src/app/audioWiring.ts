/**
 * Connects the game's sound to the rest of the game: volumes follow the settings at once, menu
 * buttons click, and each screen picks its music when it opens.
 */
import { createGameAudio, type GameAudio } from '../audio';
import type { GameSettings } from '../data/uiTypes';
import type { SceneManager } from './sceneManager';
import type { Store } from './store';
import { emitUi, onUi } from './uiEvents';

/** Controls that click when pressed. The HUD's ability buttons make their own sounds instead. */
const CLICKABLE = 'button, input[type="checkbox"], input[type="radio"]';

export function wireAudio(
  scenes: SceneManager,
  settings: Store<GameSettings>,
  uiRoot: HTMLElement,
): GameAudio {
  const audio = createGameAudio();
  settings.subscribe((s) => {
    audio.setVolumes(s);
  });
  audio.setVolumes(settings.get());
  onUi((event) => {
    audio.onUiEvent(event);
  });
  uiRoot.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest(CLICKABLE);
    if (!control || control.closest('.hud')) return;
    emitUi({ type: 'tap' });
  });
  scenes.onEnter((name, params) => {
    audio.onScene(name, params);
  });
  return audio;
}
