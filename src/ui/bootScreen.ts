/**
 * Boot / loading (docs/SCREENS.md): the lamp blinking, a progress line and "Lighting the lamp…".
 * Once loaded it asks for a tap, because browsers only allow sound after one.
 */
import { h } from './kit/dom';
import { STRINGS } from './strings';

export interface BootScreen {
  setProgress(fraction: number): void;
  /** Shows "Tap to begin" and resolves on the first tap, click or key. */
  waitForTap(): Promise<void>;
  remove(): void;
}

export function createBootScreen(parent: HTMLElement): BootScreen {
  const bar = h('span', { className: 'boot__bar-fill' });
  const text = h('p', {
    className: 'boot__text',
    textContent: STRINGS.bootLoading,
    attrs: { 'aria-live': 'polite' },
  });
  const tap = h('button', {
    type: 'button',
    className: 'boot__tap',
    textContent: STRINGS.bootTap,
    hidden: true,
  });
  const root = h(
    'div',
    { className: 'boot', id: 'boot' },
    h('div', { className: 'boot__lamp', attrs: { 'aria-hidden': 'true' } }),
    h(
      'div',
      { className: 'boot__bar', attrs: { role: 'progressbar', 'aria-label': STRINGS.bootLoading } },
      bar,
    ),
    text,
    tap,
  );
  parent.append(root);
  return {
    setProgress(fraction) {
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
    },
    waitForTap() {
      text.textContent = STRINGS.bootReady;
      tap.hidden = false;
      tap.focus();
      root.classList.add('is-ready');
      return new Promise((resolve) => {
        const done = (event: Event): void => {
          if (event instanceof KeyboardEvent && (event.key === 'Tab' || event.key === 'Shift'))
            return;
          window.removeEventListener('pointerdown', done, true);
          window.removeEventListener('keydown', done, true);
          event.preventDefault();
          resolve();
        };
        window.addEventListener('pointerdown', done, true);
        window.addEventListener('keydown', done, true);
      });
    },
    remove() {
      root.remove();
    },
  };
}
