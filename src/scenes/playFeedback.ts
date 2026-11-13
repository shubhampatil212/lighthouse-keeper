/**
 * The night's feedback beyond sight and sound: vibration on saves and wrecks (when the setting is
 * on and the device can), and screen-reader announcements of saves, wrecks and the night's end.
 */
import { UI_FEEL } from '../data';
import type { SimEvent } from '../sim/events';
import { createAnnouncer } from '../ui/announcer';
import { vibrate } from '../ui/haptics';
import { STRINGS } from '../ui/strings';

export interface PlayFeedback {
  readonly element: HTMLElement;
  event(event: SimEvent): void;
  paused(): void;
  reset(): void;
  /**
   * Shows the announcements and calls `onFocusLost` when the window loses focus or the tab is
   * hidden (so the game pauses itself). Returns a function that undoes both.
   */
  attach(parent: HTMLElement, onFocusLost: () => void): () => void;
}

export function createPlayFeedback(haptics: () => boolean): PlayFeedback {
  const announcer = createAnnouncer();
  return {
    element: announcer.element,
    event(event) {
      switch (event.type) {
        case 'shipSaved':
          announcer.saved();
          if (haptics()) vibrate(UI_FEEL.haptics.save);
          break;
        case 'shipWrecked':
          announcer.wrecked();
          if (haptics()) vibrate(UI_FEEL.haptics.wreck);
          break;
        case 'levelEnded':
          announcer.say(
            event.result.outcome === 'won'
              ? STRINGS.announceWon(event.result.stars)
              : STRINGS.announceLost,
          );
          break;
        default:
          break;
      }
    },
    paused() {
      announcer.say(STRINGS.announcePaused);
    },
    reset() {
      announcer.clear();
    },
    attach(parent, onFocusLost) {
      parent.append(announcer.element);
      const hidden = (): void => {
        if (document.hidden) onFocusLost();
      };
      window.addEventListener('blur', onFocusLost);
      document.addEventListener('visibilitychange', hidden);
      return () => {
        window.removeEventListener('blur', onFocusLost);
        document.removeEventListener('visibilitychange', hidden);
        announcer.clear();
        announcer.element.remove();
      };
    },
  };
}
