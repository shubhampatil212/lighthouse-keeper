/** The fade-to-black transition between scenes, using a DOM overlay (#fade) and CSS opacity. */
import type { Transition } from './sceneManager';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export function createFadeTransition(overlay: HTMLElement, fadeMs: number): Transition {
  overlay.style.transition = `opacity ${fadeMs}ms ease`;
  return async (swap) => {
    overlay.style.opacity = '1';
    await wait(fadeMs);
    swap();
    overlay.style.opacity = '0';
    await wait(fadeMs);
  };
}
