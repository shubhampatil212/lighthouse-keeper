/** UI kit display pieces: Card, Tabs, Stars, Coin counter and Cooldown ring. */
import { STRINGS } from '../strings';
import { h, s, svg, type Child } from './dom';
import { ICONS } from './icons';

export function card(className: string, ...children: Child[]): HTMLElement {
  return h('section', { className: `ui-card ${className}` }, ...children);
}

export interface TabDef {
  id: string;
  label: string;
  render(): HTMLElement;
}

/** Tabs with arrow-key movement between them; a panel is built the first time it's opened. */
export function tabs(label: string, defs: readonly TabDef[], start = 0): HTMLElement {
  const list = h('div', {
    className: 'ui-tabs__list',
    attrs: { role: 'tablist', 'aria-label': label },
  });
  const panels = h('div', { className: 'ui-tabs__panels' });
  const built = new Map<string, HTMLElement>();
  const buttons = defs.map((def, i) => {
    const b = h('button', {
      type: 'button',
      className: 'ui-tabs__tab',
      id: `tab-${def.id}`,
      textContent: def.label,
      attrs: { role: 'tab', 'aria-controls': `panel-${def.id}` },
    });
    b.addEventListener('click', () => {
      show(i, false);
    });
    return b;
  });
  const show = (index: number, focus: boolean): void => {
    defs.forEach((def, i) => {
      const b = buttons[i];
      if (!b) return;
      const on = i === index;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
      let panel = built.get(def.id);
      if (on && !panel) {
        panel = h(
          'div',
          {
            className: 'ui-tabs__panel',
            id: `panel-${def.id}`,
            attrs: { role: 'tabpanel', 'aria-labelledby': `tab-${def.id}`, tabindex: '0' },
          },
          def.render(),
        );
        built.set(def.id, panel);
        panels.append(panel);
      }
      if (panel) panel.hidden = !on;
    });
  };
  list.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const i = buttons.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    show((i + step + defs.length) % defs.length, true);
  });
  list.append(...buttons);
  show(start, false);
  return h('div', { className: 'ui-tabs' }, list, panels);
}

/**
 * Three stars, `got` of them filled. With `revealMs`, filled stars appear one by one
 * (the first after `delayMs`), calling `onStar` as each lands.
 */
export function stars(
  got: number,
  options: {
    size?: 'small' | 'large';
    delayMs?: number;
    revealMs?: number;
    onStar?: (n: number) => void;
  } = {},
): HTMLElement {
  const row = h('span', {
    className: `ui-stars ui-stars--${options.size ?? 'small'}`,
    attrs: { role: 'img', 'aria-label': STRINGS.starsLabel(got) },
  });
  for (let i = 0; i < 3; i++) {
    const star = h('span', { className: 'ui-star' }, svg(ICONS.star));
    if (i < got) {
      if (options.revealMs === undefined) star.classList.add('is-on');
      else {
        const at = (options.delayMs ?? 0) + i * options.revealMs;
        setTimeout(() => {
          star.classList.add('is-on', 'is-landing');
          options.onStar?.(i + 1);
        }, at);
      }
    }
    row.append(star);
  }
  return row;
}

export interface CoinCounter {
  element: HTMLElement;
  set(coins: number, pop?: boolean): void;
}

export function coinCounter(coins: number): CoinCounter {
  const value = h('span', { className: 'ui-coins__value', textContent: String(coins) });
  const element = h(
    'span',
    { className: 'ui-coins', attrs: { 'aria-label': STRINGS.coinsLabel(coins) } },
    svg(ICONS.coin),
    value,
  );
  return {
    element,
    set(next, pop = false) {
      value.textContent = String(next);
      element.setAttribute('aria-label', STRINGS.coinsLabel(next));
      if (pop) {
        // Restart the animation: remove the class, force a layout, add it back.
        element.classList.remove('is-pop');
        element.getBoundingClientRect();
        element.classList.add('is-pop');
      }
    },
  };
}

export interface CooldownRing {
  element: SVGSVGElement;
  /** 0 = ready (ring empty), 1 = just used (ring full). */
  set(fraction: number): void;
}

const RING_R = 22;
const RING_C = 2 * Math.PI * RING_R;

/** A ring drawn round an ability button that empties as the cooldown runs out. */
export function cooldownRing(): CooldownRing {
  const arc = s('circle', {
    cx: 24,
    cy: 24,
    r: RING_R,
    class: 'ui-ring__arc',
    'stroke-dasharray': RING_C.toFixed(2),
    'stroke-dashoffset': RING_C.toFixed(2),
  });
  const element = s(
    'svg',
    { viewBox: '0 0 48 48', class: 'ui-ring', 'aria-hidden': 'true' },
    s('circle', { cx: 24, cy: 24, r: RING_R, class: 'ui-ring__track' }),
    arc,
  );
  let last = -1;
  return {
    element,
    set(fraction) {
      const f = Math.round(Math.max(0, Math.min(1, fraction)) * 100) / 100;
      if (f === last) return;
      last = f;
      arc.setAttribute('stroke-dashoffset', (RING_C * (1 - f)).toFixed(2));
    },
  };
}
