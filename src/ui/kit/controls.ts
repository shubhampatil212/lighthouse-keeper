/**
 * UI kit controls: Button, IconButton, Slider, Toggle and Segmented control.
 * All are real form elements (keyboard and screen reader work for free), at least 44 px to tap.
 */
import { h, svg } from './dom';
import { ICONS, type IconId } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

export interface ButtonOptions {
  variant?: ButtonVariant;
  icon?: IconId;
  disabled?: boolean;
  /** Extra classes. */
  className?: string;
}

export function button(
  text: string,
  onClick: () => void,
  options: ButtonOptions = {},
): HTMLButtonElement {
  const b = h(
    'button',
    {
      type: 'button',
      className: `ui-button ui-button--${options.variant ?? 'secondary'} ${options.className ?? ''}`,
      disabled: options.disabled ?? false,
    },
    options.icon ? svg(ICONS[options.icon]) : null,
    h('span', { textContent: text }),
  );
  b.addEventListener('click', onClick);
  return b;
}

/** A square button showing only an icon; `label` is what screen readers say. */
export function iconButton(
  icon: IconId,
  label: string,
  onClick: () => void,
  className = '',
): HTMLButtonElement {
  const b = h(
    'button',
    { type: 'button', className: `ui-icon-button ${className}`, attrs: { 'aria-label': label } },
    svg(ICONS[icon]),
  );
  b.addEventListener('click', onClick);
  return b;
}

let uid = 0;
const nextId = (prefix: string): string => `${prefix}-${++uid}`;

/** A 0–100 slider with its label and current value. */
export function slider(
  label: string,
  value: number,
  onInput: (value: number) => void,
): HTMLElement {
  const id = nextId('slider');
  const output = h('output', { className: 'ui-slider__value', textContent: String(value) });
  const input = h('input', {
    type: 'range',
    id,
    min: '0',
    max: '100',
    step: '5',
    value: String(value),
    className: 'ui-slider__input',
  });
  const paint = (): void => {
    input.style.setProperty('--fill', `${input.value}%`);
    output.textContent = input.value;
  };
  input.addEventListener('input', () => {
    paint();
    onInput(Number(input.value));
  });
  paint();
  return h(
    'div',
    { className: 'ui-slider' },
    h('label', { htmlFor: id, textContent: label }),
    input,
    output,
  );
}

/** An on/off switch. */
export function toggle(
  label: string,
  on: boolean,
  onChange: (on: boolean) => void,
): HTMLButtonElement {
  const b = h(
    'button',
    { type: 'button', className: 'ui-toggle', attrs: { role: 'switch' } },
    h('span', { className: 'ui-toggle__label', textContent: label }),
    h('span', { className: 'ui-toggle__track' }, h('span', { className: 'ui-toggle__knob' })),
  );
  const set = (next: boolean): void => {
    b.setAttribute('aria-checked', String(next));
  };
  set(on);
  b.addEventListener('click', () => {
    const next = b.getAttribute('aria-checked') !== 'true';
    set(next);
    onChange(next);
  });
  return b;
}

/** A row of mutually exclusive choices (a radio group): arrow keys move, Enter/Space/tap pick. */
export function segmented<T extends string>(
  label: string,
  options: readonly (readonly [T, string])[],
  value: T,
  onChange: (value: T) => void,
): HTMLElement {
  const labelId = nextId('seg');
  const group = h('div', {
    className: 'ui-segmented__options',
    attrs: { role: 'radiogroup', 'aria-labelledby': labelId },
  });
  let current = value;
  const buttons = options.map(([v, text]) => {
    const b = h('button', {
      type: 'button',
      className: 'ui-segmented__option',
      textContent: text,
      attrs: { role: 'radio' },
    });
    b.addEventListener('click', () => {
      pick(v, false);
    });
    return b;
  });
  const pick = (v: T, focus: boolean): void => {
    const changed = v !== current;
    current = v;
    options.forEach(([ov], i) => {
      const b = buttons[i];
      if (!b) return;
      b.setAttribute('aria-checked', String(ov === v));
      b.tabIndex = ov === v ? 0 : -1;
      if (ov === v && focus) b.focus();
    });
    if (changed) onChange(v);
  };
  group.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const i = options.findIndex(([v]) => v === current);
    const next = options[(i + step + options.length) % options.length];
    if (next) pick(next[0], true);
  });
  group.append(...buttons);
  pick(value, false);
  return h(
    'div',
    { className: 'ui-segmented' },
    h('span', { id: labelId, className: 'ui-segmented__label', textContent: label }),
    group,
  );
}
