/**
 * Boot / loading (docs/SCREENS.md): the lamp blinking, a progress line and "Lighting the lamp…".
 * Once loaded it asks for a tap, because browsers only allow sound after one. index.html already
 * draws this screen (so it shows before any script loads); this takes it over, or builds it if
 * it isn't there.
 */
import { h } from './kit/dom';
import { STRINGS } from './strings';

export interface BootScreen {
  setProgress(fraction: number): void;
  /** Shows "Tap to begin" and resolves on the first tap, click or key. */
  waitForTap(): Promise<void>;
  remove(): void;
}

function buildBootScreen(parent: HTMLElement): HTMLElement {
  const root = h(
    'div',
    { className: 'boot', id: 'boot' },
    h('div', { className: 'boot__lamp', attrs: { 'aria-hidden': 'true' } }),
    h(
      'div',
      { className: 'boot__bar', attrs: { role: 'progressbar' } },
      h('span', { className: 'boot__bar-fill' }),
    ),
    h('p', { className: 'boot__text', attrs: { 'aria-live': 'polite' } }),
    h('button', { type: 'button', className: 'boot__tap', hidden: true }),
  );
  parent.append(root);
  return root;
}

export function createBootScreen(parent: HTMLElement): BootScreen {
  const root = document.getElementById('boot') ?? buildBootScreen(parent);
  const part = (selector: string): HTMLElement => {
    const el = root.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`Loading screen is missing ${selector}`);
    return el;
  };
  const bar = part('.boot__bar-fill');
  const text = part('.boot__text');
  const tap = part('.boot__tap');
  // The words come from strings.ts (index.html's copy is only for the first paint).
  part('.boot__bar').setAttribute('aria-label', STRINGS.bootLoading);
  text.textContent = STRINGS.bootLoading;
  tap.textContent = STRINGS.bootTap;
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
