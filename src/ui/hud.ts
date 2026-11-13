/**
 * The play HUD (docs/SCREENS.md "Play"): level name and a bar of ships still to come (top left);
 * ships home, wrecks left and pause (top right); ability buttons with cooldown rings in the thumb
 * zone (mirrored for left hands); tutorial prompts bottom centre, clear of the island.
 */
import type { ActionIntent } from '../input/controller';
import { iconButton } from './kit/controls';
import { cooldownRing, type CooldownRing } from './kit/display';
import { h, svg } from './kit/dom';
import { ICONS, type IconId } from './kit/icons';
import { STRINGS } from './strings';

export interface HudInfo {
  /** Ships that have appeared, out of the night's total (0 total = endless). */
  spawned: number;
  total: number;
  saved: number;
  allowance: number;
  wrecked: number;
  caught: number;
  /** Abilities: null hides the button. */
  foghorn: { cooldown: number; full: number } | null;
  flares: number | null;
  /** Which lamp is steered (0 or 1), or null with only one lighthouse. */
  lamp: number | null;
}

export interface Hud {
  readonly element: HTMLElement;
  setLevel(code: string, name: string): void;
  update(info: HudInfo): void;
  setLeftHanded(on: boolean): void;
  /** A tutorial prompt, or null to hide it. */
  prompt(text: string | null): void;
  /** Height of the top bar and the bottom (ability) bar, in CSS px, for the edge arrows. */
  insets(): { top: number; bottom: number };
}

interface AbilityButton {
  button: HTMLButtonElement;
  ring: CooldownRing | null;
  badge: HTMLElement;
  label: string;
}

function abilityButton(icon: IconId, onPress: () => void, withRing: boolean): AbilityButton {
  const ring = withRing ? cooldownRing() : null;
  const badge = h('span', { className: 'hud-ability__badge' });
  const button = h(
    'button',
    { type: 'button', className: 'hud-ability', hidden: true },
    svg(ICONS[icon]),
    badge,
  );
  if (ring) button.prepend(ring.element);
  // pointerdown, not click: on a phone the steering finger is usually still down.
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onPress();
  });
  // Keyboard: Enter / Space still work through click.
  button.addEventListener('click', (event) => {
    if (event.detail === 0) onPress();
  });
  return { button, ring, badge, label: '' };
}

export function createHud(onPause: () => void, onAction: (action: ActionIntent) => void): Hud {
  const code = h('span', { className: 'hud-level__code' });
  const name = h('span', { className: 'hud-level__name' });
  const fill = h('span', { className: 'hud-progress__fill' });
  const bar = h(
    'span',
    { className: 'hud-progress', attrs: { role: 'progressbar', 'aria-valuemin': '0' } },
    fill,
  );
  const saved = h('span', { className: 'hud-count' });
  const hulls = h('span', { className: 'hud-hulls', attrs: { role: 'img' } });
  const caught = h('span', { className: 'hud-count hud-caught', hidden: true });
  const pause = iconButton('pause', STRINGS.hudPause, onPause, 'hud-pause');
  const top = h(
    'div',
    { className: 'hud-top' },
    h(
      'div',
      { className: 'hud-level' },
      h('p', { className: 'hud-level__title' }, code, name),
      bar,
    ),
    h('div', { className: 'hud-status' }, saved, caught, hulls, pause),
  );

  const horn = abilityButton(
    'horn',
    () => {
      onAction('foghorn');
    },
    true,
  );
  const flare = abilityButton(
    'flare',
    () => {
      onAction('flare');
    },
    false,
  );
  const lamp = abilityButton(
    'lamp',
    () => {
      onAction('switchLamp');
    },
    false,
  );
  const abilities = h(
    'div',
    { className: 'hud-abilities' },
    horn.button,
    flare.button,
    lamp.button,
  );
  const promptText = h('p', {
    className: 'hud-prompt',
    hidden: true,
    attrs: { 'aria-live': 'polite' },
  });
  const element = h('div', { className: 'hud' }, top, promptText, abilities);

  const setAbility = (
    b: AbilityButton,
    shown: boolean,
    label: string,
    badge: string,
    ready: boolean,
  ): void => {
    b.button.hidden = !shown;
    if (!shown) return;
    if (b.label !== label) {
      b.label = label;
      b.button.setAttribute('aria-label', label);
    }
    if (b.badge.textContent !== badge) b.badge.textContent = badge;
    b.button.classList.toggle('is-cooling', !ready);
  };

  let lastKey = '';
  return {
    element,
    setLevel(levelCode, levelName) {
      code.textContent = levelCode;
      name.textContent = levelName;
      bar.setAttribute('aria-label', STRINGS.hudProgressLabel(levelName));
    },
    update(info) {
      const key = `${info.spawned}/${info.total}/${info.saved}/${info.wrecked}/${info.caught}`;
      if (key !== lastKey) {
        lastKey = key;
        bar.hidden = info.total === 0;
        bar.setAttribute('aria-valuemax', String(info.total));
        bar.setAttribute('aria-valuenow', String(info.spawned));
        fill.style.transform = `scaleX(${info.total ? 1 - info.spawned / info.total : 0})`;
        saved.replaceChildren(svg(ICONS.anchor), String(info.saved));
        saved.setAttribute('aria-label', STRINGS.hudSaved(info.saved));
        const left = Math.max(0, info.allowance - info.wrecked);
        hulls.replaceChildren(
          ...Array.from({ length: info.allowance }, (_, i) =>
            h('span', { className: i < left ? 'hud-hull' : 'hud-hull is-lost' }, svg(ICONS.hull)),
          ),
        );
        hulls.setAttribute('aria-label', STRINGS.hudSpareHulls(left));
        caught.hidden = info.caught === 0;
        caught.textContent = STRINGS.hudCaught(info.caught);
      }
      const hornInfo = info.foghorn;
      const wait = hornInfo ? Math.ceil(hornInfo.cooldown) : 0;
      setAbility(
        horn,
        hornInfo !== null,
        STRINGS.abilityFoghornLabel(wait),
        wait > 0 ? String(wait) : '',
        wait === 0,
      );
      horn.ring?.set(hornInfo && hornInfo.full > 0 ? hornInfo.cooldown / hornInfo.full : 0);
      const charges = info.flares ?? 0;
      setAbility(
        flare,
        info.flares !== null,
        STRINGS.abilityFlareLabel(charges),
        String(charges),
        charges > 0,
      );
      setAbility(
        lamp,
        info.lamp !== null,
        STRINGS.abilitySwitchLampLabel,
        String((info.lamp ?? 0) + 1),
        true,
      );
    },
    setLeftHanded(on) {
      element.classList.toggle('is-left-handed', on);
    },
    prompt(text) {
      promptText.hidden = text === null;
      if (text !== null) promptText.textContent = text;
    },
    insets() {
      const box = element.getBoundingClientRect();
      const topBox = top.getBoundingClientRect();
      const abilityBox = abilities.getBoundingClientRect();
      return {
        top: Math.max(0, topBox.bottom - box.top),
        bottom: abilities.offsetHeight > 0 ? Math.max(0, box.bottom - abilityBox.top) : 0,
      };
    },
  };
}
