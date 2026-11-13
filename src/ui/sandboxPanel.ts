/**
 * Sandbox panel (debug only, #sandbox): send in any ship, add or clear any hazard, place things by
 * tapping the sea, change the time scale, and switch the abilities, second harbor and second lamp.
 * It's a developer tool, so its labels aren't in strings.ts.
 */
import './sandboxPanel.css';
import type { Compass, HazardKind, ShipTypeId } from '../data/types';

/** What a tap on the sea places while "place on tap" is on. */
export type PlaceKind = ShipTypeId | 'fogBand' | 'iceberg' | 'whirlpool' | 'pirate';

/** Night options that need a restart. */
export interface SandboxSetup {
  secondHarbor: boolean;
  secondLamp: boolean;
  foghorn: number;
  flares: number;
  /** Reef indexes with a bell buoy. */
  buoys: readonly number[];
}

export interface SandboxHandlers {
  spawnShip(type: ShipTypeId, harbor: number, from: Compass | 'random'): void;
  addHazard(kind: HazardKind): void;
  clearHazard(kind: HazardKind): void;
  /** Null = taps steer the beam again. */
  setPlacing(kind: PlaceKind | null, harbor: number): void;
  setTimeScale(scale: number): void;
  /** Applies options that restart the night. */
  setSetup(setup: SandboxSetup): void;
  restart(): void;
}

export interface SandboxPanel {
  show(on: boolean): void;
}

const SHIPS: readonly ShipTypeId[] = [
  'fishing',
  'cargo',
  'sailboat',
  'ferry',
  'tugboat',
  'smuggler',
];
const PLACEABLE: readonly (readonly [PlaceKind, string])[] = [
  ...SHIPS.map((t) => [t, `Ship: ${t}`] as const),
  ['fogBand', 'Fog band'],
  ['iceberg', 'Iceberg'],
  ['whirlpool', 'Whirlpool'],
  ['pirate', 'Pirate'],
];
const FROM: readonly (Compass | 'random')[] = ['random', 'north', 'east', 'south', 'west'];
const HAZARDS: readonly (readonly [HazardKind, string])[] = [
  ['fogBand', 'Fog band'],
  ['iceberg', 'Iceberg'],
  ['whirlpool', 'Whirlpool'],
  ['pirate', 'Pirate'],
  ['lightning', 'Lightning'],
  ['stormWaves', 'Storm waves'],
];
const SPEEDS = [0.25, 0.5, 1, 2, 4];
const REEF_COUNT = 4;

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] => Object.assign(document.createElement(tag), props);

const button = (text: string, onClick: () => void): HTMLButtonElement => {
  const b = el('button', { type: 'button', textContent: text });
  b.addEventListener('click', onClick);
  return b;
};

function selectOf<T extends string | number>(
  options: readonly (readonly [T, string])[],
  start: T,
): { element: HTMLSelectElement; value(): T } {
  const element = el('select');
  for (const [value, text] of options) element.append(new Option(text, String(value)));
  element.value = String(start);
  return {
    element,
    value: () => options.find(([v]) => String(v) === element.value)?.[0] ?? start,
  };
}

function group(legend: string, ...children: HTMLElement[]): HTMLFieldSetElement {
  const set = el('fieldset');
  set.append(el('legend', { textContent: legend }), ...children);
  return set;
}

function check(text: string, on: boolean, onChange: (on: boolean) => void): HTMLLabelElement {
  const input = el('input', { type: 'checkbox', checked: on });
  input.addEventListener('change', () => {
    onChange(input.checked);
  });
  const label = el('label');
  label.append(input, text);
  return label;
}

export function createSandboxPanel(
  parent: HTMLElement,
  start: SandboxSetup,
  handlers: SandboxHandlers,
): SandboxPanel {
  const root = el('section', { className: 'sandbox-panel' });
  root.setAttribute('aria-label', 'Sandbox');
  const body = el('div');
  const toggle = button('Sandbox ▾', () => {
    body.hidden = !body.hidden;
    toggle.textContent = body.hidden ? 'Sandbox ▸' : 'Sandbox ▾';
  });
  let setup: SandboxSetup = start;
  const change = (next: Partial<SandboxSetup>): void => {
    setup = { ...setup, ...next };
    handlers.setSetup(setup);
  };

  // Ships.
  const shipType = selectOf(
    SHIPS.map((t) => [t, t] as const),
    'fishing',
  );
  const harbor = selectOf(
    [
      [0, 'island harbor'],
      [1, 'second harbor'],
    ],
    0,
  );
  const from = selectOf(
    FROM.map((f) => [f, `from ${f}`] as const),
    'random',
  );
  const ships = group(
    'Ships',
    shipType.element,
    from.element,
    harbor.element,
    button('Send ship', () => {
      handlers.spawnShip(shipType.value(), harbor.value(), from.value());
    }),
  );

  // Hazards: add at a random fair spot, or clear.
  const hazardRows = HAZARDS.map(([kind, text]) => {
    const row = el('div', { className: 'row' });
    row.append(
      el('span', { textContent: text }),
      button(kind === 'lightning' || kind === 'stormWaves' ? 'On' : 'Add', () => {
        handlers.addHazard(kind);
      }),
      button(kind === 'lightning' || kind === 'stormWaves' ? 'Off' : 'Clear', () => {
        handlers.clearHazard(kind);
      }),
    );
    return row;
  });
  const hazards = group('Hazards', ...hazardRows);

  // Tap to place.
  const placeKind = selectOf(PLACEABLE, 'iceberg');
  let placing = false;
  const placeButton = button('Place on tap: off', () => {
    placing = !placing;
    placeButton.textContent = placing ? 'Place on tap: ON (tap the sea)' : 'Place on tap: off';
    placeButton.classList.toggle('on', placing);
    handlers.setPlacing(placing ? placeKind.value() : null, harbor.value());
  });
  placeKind.element.addEventListener('change', () => {
    if (placing) handlers.setPlacing(placeKind.value(), harbor.value());
  });
  const place = group('Place on tap', placeKind.element, placeButton);

  // Time scale.
  const speedRow = el('div', { className: 'row' });
  const speedButtons = SPEEDS.map((speed) => {
    const b = button(`${speed}×`, () => {
      handlers.setTimeScale(speed);
      for (const other of speedButtons) other.classList.toggle('on', other === b);
    });
    b.classList.toggle('on', speed === 1);
    return b;
  });
  speedRow.append(...speedButtons);
  const time = group('Time scale', speedRow);

  // Night options (restart).
  const level = (n: number): readonly (readonly [number, string])[] =>
    Array.from({ length: n + 1 }, (_, i) => [i, String(i)] as const);
  const horn = selectOf(level(3), start.foghorn);
  horn.element.addEventListener('change', () => {
    change({ foghorn: horn.value() });
  });
  const flares = selectOf(level(3), start.flares);
  flares.element.addEventListener('change', () => {
    change({ flares: flares.value() });
  });
  const hornLabel = el('label');
  hornLabel.append('Foghorn level ', horn.element);
  const flareLabel = el('label');
  flareLabel.append('Flare charges ', flares.element);
  const buoys = el('div', { className: 'row' });
  buoys.append('Buoys on reefs:');
  for (let i = 0; i < REEF_COUNT; i++) {
    buoys.append(
      check(String(i), start.buoys.includes(i), (on) => {
        const list = setup.buoys.filter((b) => b !== i);
        change({ buoys: on ? [...list, i] : list });
      }),
    );
  }
  const night = group(
    'Night (changes restart)',
    hornLabel,
    flareLabel,
    buoys,
    check('Second harbor', start.secondHarbor, (on) => {
      change({ secondHarbor: on });
    }),
    check('Second lamp', start.secondLamp, (on) => {
      change({ secondLamp: on });
    }),
    button('Restart (clear everything)', () => {
      handlers.restart();
    }),
  );

  body.append(ships, hazards, place, time, night);
  root.append(toggle, body);
  parent.append(root);

  return {
    show(on) {
      root.hidden = !on;
    },
  };
}
