/**
 * First launch: pick Calm, Keeper or Storm, then the first night starts at once
 * (docs/SCREENS.md "Difficulty choice"). The choice can be changed later in Settings.
 */
import type { Scene } from '../app/sceneManager';
import type { DifficultyId } from '../data/types';
import { button } from '../ui/kit/controls';
import { h } from '../ui/kit/dom';
import { STRINGS } from '../ui/strings';
import type { GameContext } from './context';
import { menuScene } from './menuScene';

const CHOICES: readonly DifficultyId[] = ['calm', 'keeper', 'storm'];

export function createDifficultyScene(ctx: GameContext): Scene {
  return menuScene(ctx, () => {
    let chosen: DifficultyId = ctx.settings.get().difficulty;
    const group = h('div', {
      className: 'choice-cards',
      attrs: { role: 'radiogroup', 'aria-labelledby': 'difficulty-title' },
    });
    const cards = CHOICES.map((id) => {
      const card = h(
        'button',
        { type: 'button', className: 'choice-card', attrs: { role: 'radio' } },
        h('span', { className: 'choice-card__name', textContent: STRINGS.difficultyName[id] }),
        h('span', { className: 'choice-card__line', textContent: STRINGS.difficultyLine[id] }),
      );
      card.addEventListener('click', () => {
        pick(id, false);
      });
      return card;
    });
    const pick = (id: DifficultyId, focus: boolean): void => {
      chosen = id;
      CHOICES.forEach((c, i) => {
        const card = cards[i];
        if (!card) return;
        card.setAttribute('aria-checked', String(c === id));
        card.tabIndex = c === id ? 0 : -1;
        if (c === id && focus) card.focus();
      });
    };
    group.addEventListener('keydown', (event) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = CHOICES[(CHOICES.indexOf(chosen) + step + CHOICES.length) % CHOICES.length];
      if (next) pick(next, true);
    });
    group.append(...cards);
    pick(chosen, false);
    cards[CHOICES.indexOf(chosen)]?.setAttribute('data-autofocus', '');

    const start = button(
      STRINGS.difficultyStart,
      () => {
        ctx.settings.update((s) => ({ ...s, difficulty: chosen }));
        ctx.progress.update((p) => ({ ...p, started: true }));
        ctx.startNight('1-1');
      },
      { variant: 'primary', icon: 'lamp' },
    );

    const root = h(
      'main',
      { className: 'menu-screen' },
      h(
        'div',
        { className: 'menu-column' },
        h('h1', {
          id: 'difficulty-title',
          className: 'screen-title',
          textContent: STRINGS.difficultyTitle,
        }),
        group,
        h('p', { className: 'menu-hint', textContent: STRINGS.difficultyNote }),
        start,
      ),
    );
    return { root };
  });
}
