/** A short notice at the bottom of the screen ("Finish Harbor Bay to sail here"), read out politely. */
import { UI_FEEL } from '../data';
import { h } from './kit/dom';

export function createToast(parent: HTMLElement): (text: string) => void {
  const el = h('p', { className: 'toast', attrs: { role: 'status', 'aria-live': 'polite' } });
  parent.append(el);
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (text) => {
    el.textContent = text;
    el.classList.add('is-shown');
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      el.classList.remove('is-shown');
    }, UI_FEEL.toastMs);
  };
}
