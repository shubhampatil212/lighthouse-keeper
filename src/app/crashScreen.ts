/**
 * When something breaks, the player sees a calm "Something went wrong" card with a Reload button
 * instead of a frozen screen. The save is written first (it's checked again when the game loads,
 * so a bad value can't stick). Shown once; errors from other sites' scripts (browser extensions)
 * are ignored, since they aren't the game's.
 */
import { STRINGS } from '../ui/strings';

export interface CrashScreen {
  /** What to save before the card shows (set once the save is loaded). */
  setSaver(save: () => void): void;
  /** Shows the card for an error the game caught itself (a failed start). */
  show(error: unknown): void;
}

export function watchForCrashes(): CrashScreen {
  let saver: (() => void) | null = null;
  let shown = false;

  const show = (error: unknown): void => {
    console.error(error);
    if (shown) return;
    shown = true;
    try {
      saver?.();
    } catch {
      // The save couldn't be written; the last good one is still in storage.
    }
    const card = document.createElement('div');
    card.className = 'crash';
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-labelledby', 'crash-title');
    const title = document.createElement('h1');
    title.id = 'crash-title';
    title.textContent = STRINGS.crashTitle;
    const body = document.createElement('p');
    body.textContent = STRINGS.crashBody;
    const reload = document.createElement('button');
    reload.type = 'button';
    reload.className = 'ui-button ui-button--primary';
    reload.textContent = STRINGS.crashReload;
    reload.addEventListener('click', () => {
      location.reload();
    });
    card.append(title, body, reload);
    document.body.append(card);
    reload.focus();
  };

  const ours = (filename: string | undefined): boolean =>
    !filename || filename.startsWith(location.origin);

  window.addEventListener('error', (event) => {
    // Resource load failures (an image, a font) and cross-site "Script error." aren't crashes.
    if (!(event.error instanceof Error) || !ours(event.filename)) return;
    show(event.error);
  });
  window.addEventListener('unhandledrejection', (event) => {
    show(event.reason);
  });

  return {
    setSaver(save) {
      saver = save;
    },
    show,
  };
}
