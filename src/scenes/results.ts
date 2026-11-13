/**
 * Results: dawn breaks over the sea, stars land one at a time, then the night's numbers
 * (docs/SCREENS.md "Results"). A failed night gets a gentle tip based on what went wrong.
 */
import { levelDef, nextLevelId, placeOf } from '../app/campaign';
import type { Scene } from '../app/sceneManager';
import { UI_FEEL } from '../data';
import type { LevelResult } from '../sim/events';
import { button } from '../ui/kit/controls';
import { card, coinCounter, stars } from '../ui/kit/display';
import { h, reducedMotion } from '../ui/kit/dom';
import { STRINGS } from '../ui/strings';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';
import { pickTip, type NightReport } from './nightLog';

export interface ResultsParams {
  levelId: string;
  result: LevelResult;
  report: NightReport;
}

const minutes = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function createResultsScene(ctx: GameContext): Scene {
  return menuScene(ctx, (params) => {
    const { levelId, result, report } = params as unknown as ResultsParams;
    const level = levelDef(levelId);
    const won = result.outcome === 'won';
    const calm = reducedMotion();
    const toMap = (): void => {
      void ctx.nav.reset(SCENE.map, {}, [{ name: SCENE.title, params: {} }]);
    };
    const toShop = (): void => {
      void ctx.nav.reset(SCENE.shop, { levelId: nextLevelId(levelId) ?? levelId }, [
        { name: SCENE.title, params: {} },
        { name: SCENE.map, params: {} },
      ]);
    };
    const next = nextLevelId(levelId);
    const toNext = (): void => {
      if (!next) {
        toMap();
        return;
      }
      const region = placeOf(next)?.region.id;
      void ctx.nav.reset(SCENE.briefing, { levelId: next }, [
        { name: SCENE.title, params: {} },
        { name: SCENE.map, params: {} },
        { name: SCENE.levelSelect, params: { region } },
      ]);
    };

    const bonus = STRINGS.bonus(level.bonus);
    const stats = h(
      'dl',
      { className: 'results__stats' },
      h('dt', { textContent: STRINGS.resultsSaved }),
      h('dd', { textContent: STRINGS.ofTotal(result.saved, result.total) }),
      h('dt', { textContent: STRINGS.resultsWrecked }),
      h('dd', { textContent: String(result.wrecked) }),
      result.caught > 0 ? h('dt', { textContent: STRINGS.resultsCaught }) : null,
      result.caught > 0 ? h('dd', { textContent: String(result.caught) }) : null,
      h('dt', { textContent: STRINGS.resultsTime }),
      h('dd', { textContent: minutes(result.time) }),
      bonus ? h('dt', { textContent: bonus }) : null,
      bonus
        ? h('dd', {
            className: result.bonusMet ? 'is-yes' : 'is-no',
            textContent: result.bonusMet ? STRINGS.bonusDone : STRINGS.bonusMissed,
          })
        : null,
      h('dt', { textContent: STRINGS.resultsCoins }),
      h('dd', {}, coinCounter(result.coins).element),
    );

    const actions = won
      ? [
          button(STRINGS.resultsNext, toNext, { variant: 'primary', icon: 'play' }),
          button(
            STRINGS.resultsRetry,
            () => {
              ctx.startNight(levelId);
            },
            { icon: 'restart' },
          ),
          button(STRINGS.resultsHarbor, toShop, { icon: 'anchor' }),
        ]
      : [
          button(
            STRINGS.resultsRetry,
            () => {
              ctx.startNight(levelId);
            },
            { variant: 'primary', icon: 'restart' },
          ),
          button(STRINGS.resultsHarbor, toShop, { icon: 'anchor' }),
        ];
    actions[0]?.setAttribute('data-autofocus', '');

    const sky = h('div', {
      className: `dawn-sky${won ? '' : ' dawn-sky--fog'}`,
      attrs: { 'aria-hidden': 'true' },
    });
    sky.style.setProperty('--dawn-ms', `${calm ? 0 : UI_FEEL.dawnMs}ms`);

    const heading = won
      ? STRINGS.endWon
      : result.failReason === 'preciousLost'
        ? STRINGS.endFailedPrecious
        : STRINGS.endFailed;
    const root = h(
      'main',
      { className: 'menu-screen results' },
      sky,
      h(
        'div',
        { className: 'menu-column' },
        card(
          'results__card',
          h('p', { className: 'eyebrow', textContent: STRINGS.levelTitle(levelId, level.name) }),
          h('h1', { className: 'results__title', textContent: heading }),
          won
            ? stars(result.stars, {
                size: 'large',
                delayMs: calm ? 0 : UI_FEEL.starDelayMs,
                revealMs: calm ? 0 : UI_FEEL.starIntervalMs,
              })
            : h('p', {
                className: 'results__tip',
                textContent: STRINGS.tip[pickTip(report, result.failReason)],
              }),
          stats,
        ),
        h('div', { className: 'results__actions' }, ...actions),
      ),
    );
    return {
      root,
      back() {
        toMap();
        return true;
      },
    };
  });
}
