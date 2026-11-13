/**
 * The transition between scenes: a fade to the night color (#fade, CSS opacity) with a band of fog
 * sweeping across it (CSS; hidden with reduced motion).
 */
import type { Transition } from './sceneManager';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function createFadeTransition(overlay: HTMLElement, fadeMs: number): Transition {
  overlay.style.transition = `opacity ${fadeMs}ms ease`;
  return async (swap) => {
    overlay.classList.remove('is-wiping');
    overlay.getBoundingClientRect();
    overlay.classList.add('is-wiping');
    overlay.style.opacity = '1';
    await wait(fadeMs);
    swap();
    overlay.style.opacity = '0';
    await wait(fadeMs);
    overlay.classList.remove('is-wiping');
  };
}
