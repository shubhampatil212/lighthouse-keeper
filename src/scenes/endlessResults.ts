/**
 * Endless watch results: score, best, time, ships saved and the daily-seed tag
 * (docs/SCREENS.md "Endless results"). The mode itself arrives in phase 06; until then this screen
 * can be previewed with ?screen=endlessResults.
 */
import type { Scene } from '../app/sceneManager';
import { button } from '../ui/kit/controls';
import { card } from '../ui/kit/display';
import { h } from '../ui/kit/dom';
import { STRINGS } from '../ui/strings';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';

export interface EndlessResultsParams {
  score: number;
  best: number;
  seconds: number;
  saved: number;
  /** The date of the daily sea (YYYY-MM-DD), or null for a free run. */
  daily: string | null;
}

const PREVIEW: EndlessResultsParams = {
  score: 342,
  best: 412,
  seconds: 222,
  saved: 12,
  daily: null,
};

export function createEndlessResultsScene(ctx: GameContext): Scene {
  return menuScene(ctx, (params) => {
    const run = 'score' in params ? (params as unknown as EndlessResultsParams) : PREVIEW;
    const isBest = run.score >= run.best;
    const again = button(
      STRINGS.endlessAgain,
      () => {
        ctx.toast(STRINGS.endlessSoon);
      },
      {
        variant: 'primary',
        icon: 'restart',
      },
    );
    again.dataset.autofocus = '';
    const root = h(
      'main',
      { className: 'menu-screen' },
      h(
        'div',
        { className: 'menu-column' },
        card(
          'results__card',
          h('p', {
            className: 'eyebrow',
            textContent: run.daily ? STRINGS.endlessDaily(run.daily) : STRINGS.titleEndless,
          }),
          h('h1', { className: 'results__title', textContent: STRINGS.endlessScore(run.score) }),
          isBest
            ? h('p', { className: 'results__best', textContent: STRINGS.endlessNewBest })
            : null,
          h(
            'dl',
            { className: 'results__stats' },
            h('dt', { textContent: STRINGS.endlessBest }),
            h('dd', { textContent: String(Math.max(run.best, run.score)) }),
            h('dt', { textContent: STRINGS.resultsTime }),
            h('dd', {
              textContent: `${Math.floor(run.seconds / 60)}:${String(run.seconds % 60).padStart(2, '0')}`,
            }),
            h('dt', { textContent: STRINGS.resultsSaved }),
            h('dd', { textContent: String(run.saved) }),
          ),
        ),
        h(
          'div',
          { className: 'results__actions' },
          again,
          button(STRINGS.endlessTitle, () => void ctx.nav.reset(SCENE.title)),
        ),
      ),
    );
    return { root };
  });
}
