/**
 * A polite live region for screen readers: during a night it says when ships come home or are
 * wrecked, and how the night ended. Saves or wrecks close together are joined ("3 ships are home.")
 * so the reader isn't flooded.
 */
import { UI_FEEL } from '../data';
import { h } from './kit/dom';
import { STRINGS } from './strings';

export interface Announcer {
  readonly element: HTMLElement;
  saved(): void;
  wrecked(): void;
  /** Says it at once (after anything still waiting). */
  say(text: string): void;
  clear(): void;
}

export function createAnnouncer(): Announcer {
  const element = h('p', {
    className: 'sr-only',
    attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
  });
  let saved = 0;
  let wrecked = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const speak = (text: string): void => {
    // Clearing first makes screen readers repeat a message that's the same as the last one.
    element.textContent = '';
    requestAnimationFrame(() => {
      element.textContent = text;
    });
  };
  const flush = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    const parts: string[] = [];
    if (saved > 0) parts.push(STRINGS.announceSaved(saved));
    if (wrecked > 0) parts.push(STRINGS.announceWrecked(wrecked));
    saved = 0;
    wrecked = 0;
    if (parts.length > 0) speak(parts.join(' '));
  };
  const soon = (): void => {
    timer ??= setTimeout(flush, UI_FEEL.announceGapMs);
  };

  return {
    element,
    saved() {
      saved += 1;
      soon();
    },
    wrecked() {
      wrecked += 1;
      soon();
    },
    say(text) {
      const waiting = saved + wrecked > 0;
      flush();
      if (waiting) {
        setTimeout(() => {
          speak(text);
        }, UI_FEEL.announceGapMs);
      } else speak(text);
    },
    clear() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      saved = 0;
      wrecked = 0;
      element.textContent = '';
    },
  };
}
