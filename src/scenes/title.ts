/** Title: the game's name over the live sea, and the ways in (docs/SCREENS.md "Title"). */
import { isEndlessUnlocked } from '../app/progress';
import type { Scene } from '../app/sceneManager';
import { button } from '../ui/kit/controls';
import { h } from '../ui/kit/dom';
import { STRINGS } from '../ui/strings';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';

export function createTitleScene(ctx: GameContext): Scene {
  return menuScene(ctx, () => {
    const progress = ctx.progress.get();
    const endlessOpen = isEndlessUnlocked(progress);

    const begin = button(
      progress.started ? STRINGS.titleContinue : STRINGS.titleBegin,
      () => {
        void ctx.nav.go(progress.started ? SCENE.map : SCENE.difficulty);
      },
      { variant: 'primary', icon: 'lamp' },
    );
    begin.dataset.autofocus = '';

    // Locked: still focusable, so the hint can be read; tapping it explains how to open it.
    const endless = button(STRINGS.titleEndless, () => {
      ctx.toast(endlessOpen ? STRINGS.endlessSoon : STRINGS.endlessLocked);
    });
    if (!endlessOpen) {
      endless.classList.add('is-locked');
      endless.setAttribute('aria-describedby', 'endless-hint');
    }

    const root = h(
      'main',
      { className: 'title-screen' },
      h(
        'h1',
        { className: 'title-screen__name' },
        h('span', { textContent: STRINGS.gameTitleTop }),
        h('span', { textContent: STRINGS.gameTitleBottom }),
      ),
      h(
        'nav',
        { className: 'menu-column', attrs: { 'aria-label': STRINGS.titleMenuLabel } },
        begin,
        endless,
        endlessOpen
          ? null
          : h('p', {
              id: 'endless-hint',
              className: 'menu-hint',
              textContent: STRINGS.endlessLocked,
            }),
        button(STRINGS.titleLogbook, () => void ctx.nav.go(SCENE.logbook), { icon: 'book' }),
        button(STRINGS.titleSettings, () => void ctx.nav.go(SCENE.settings), { icon: 'gear' }),
      ),
      h(
        'footer',
        { className: 'title-screen__footer' },
        button(STRINGS.titleCredits, () => void ctx.nav.go(SCENE.credits), { variant: 'quiet' }),
        h('span', {
          className: 'title-screen__version',
          textContent: STRINGS.version(ctx.version),
        }),
      ),
    );
    return { root };
  });
}
