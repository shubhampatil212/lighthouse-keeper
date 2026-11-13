/**
 * Back behavior (docs/SCREENS.md): Esc and the browser's back button both mean "back".
 * First an open dialog closes, then the scene gets a say (play opens Pause), then the previous
 * screen returns. The browser history keeps one spare entry so its back button can be caught;
 * on the title screen, back leaves the page as usual.
 */
import { emitUi } from './uiEvents';
import type { SceneManager, SceneParams, StackEntry } from './sceneManager';

export interface Navigator {
  go(name: string, params?: SceneParams): Promise<void>;
  /** Go to `name` with exactly `under` as the screens behind it. */
  reset(name: string, params?: SceneParams, under?: readonly StackEntry[]): Promise<void>;
  back(): void;
  /** Close the top dialog, if any (set by the UI kit's modal stack). */
  closeDialog: () => boolean;
}

export function createNavigator(scenes: SceneManager, win: Window = window): Navigator {
  const history = win.history;
  const GUARD = { lighthouse: 'guard' };
  history.replaceState({ lighthouse: 'root' }, '');
  history.pushState(GUARD, '');

  const nav: Navigator = {
    go: (name, params) => scenes.go(name, params),
    reset: (name, params, under = []) => scenes.go(name, params, { stack: under }),
    back() {
      emitUi({ type: 'back' });
      if (nav.closeDialog()) return;
      if (scenes.current?.back?.()) return;
      void scenes.back();
    },
    closeDialog: () => false,
  };

  win.addEventListener('popstate', () => {
    emitUi({ type: 'back' });
    if (nav.closeDialog() || scenes.current?.back?.() === true) {
      history.pushState(GUARD, '');
      return;
    }
    if (scenes.canGoBack) {
      history.pushState(GUARD, '');
      void scenes.back();
      return;
    }
    // Nothing to go back to: let the browser leave the game.
    history.back();
  });

  win.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.repeat) return;
    event.preventDefault();
    nav.back();
  });
  return nav;
}
