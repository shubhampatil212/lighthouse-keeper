/** Credits: a short, slowly scrolling list (docs/SCREENS.md "Credits"). */
import type { Scene } from '../app/sceneManager';
import { screenHeader } from '../ui/header';
import { h } from '../ui/kit/dom';
import { STRINGS } from '../ui/strings';
import type { GameContext } from './context';
import { menuScene } from './menuScene';

export function createCreditsScene(ctx: GameContext): Scene {
  return menuScene(ctx, () => {
    const roll = h(
      'div',
      { className: 'credits-roll', attrs: { tabindex: '0', 'aria-label': STRINGS.creditsTitle } },
      ...STRINGS.credits.map(([heading, ...lines]) =>
        h(
          'section',
          {},
          h('h2', { textContent: heading }),
          ...lines.map((line) => h('p', { textContent: line })),
        ),
      ),
    );
    const root = h(
      'main',
      { className: 'menu-screen menu-screen--top' },
      screenHeader(STRINGS.creditsTitle, () => {
        ctx.nav.back();
      }),
      h('div', { className: 'menu-column credits' }, roll),
    );
    return { root };
  });
}
