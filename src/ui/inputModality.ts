/**
 * Whether the player last used the keyboard or a pointer (finger, mouse). Screens focus their first
 * control so keyboard players can start at once; after a tap, that focus shouldn't draw a ring.
 */
let lastInput: 'keyboard' | 'pointer' | null = null;

window.addEventListener(
  'keydown',
  () => {
    lastInput = 'keyboard';
  },
  true,
);
window.addEventListener(
  'pointerdown',
  () => {
    lastInput = 'pointer';
  },
  true,
);

/** Focuses `el`, showing the focus ring only if the keyboard was used last (or nothing yet). */
export function focusQuietly(el: HTMLElement): void {
  el.focus({ preventScroll: true, focusVisible: lastInput !== 'pointer' });
}
