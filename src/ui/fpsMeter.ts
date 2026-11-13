/** The "Show frame rate" setting: a small counter in the corner, updated twice a second. */
import { h } from './kit/dom';

export interface FpsMeter {
  frame(now: number): void;
  show(on: boolean): void;
}

export function createFpsMeter(parent: HTMLElement): FpsMeter {
  const el = h('p', { className: 'fps-meter', hidden: true, attrs: { 'aria-hidden': 'true' } });
  parent.append(el);
  let frames = 0;
  let since: number | null = null;
  return {
    frame(now) {
      if (el.hidden) return;
      since ??= now;
      frames++;
      if (now - since >= 500) {
        el.textContent = `${Math.round((frames * 1000) / (now - since))} fps`;
        frames = 0;
        since = now;
      }
    },
    show(on) {
      el.hidden = !on;
      frames = 0;
      since = null;
    },
  };
}
