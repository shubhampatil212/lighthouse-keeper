/**
 * Results: dawn breaks over the sea, stars land one at a time, then the night's numbers
 * (docs/SCREENS.md "Results"). A failed night gets a gentle tip based on what went wrong.
 */
import { emitUi } from '../app/uiEvents';
import { levelDef, nextLevelId, placeOf } from '../app/campaign';
import type { NightAward, Unlock } from '../app/progress';
import type { Scene } from '../app/sceneManager';
import { UI_FEEL } from '../data';
import type { LevelResult } from '../sim/events';
import { button } from '../ui/kit/controls';
import { card, coinCounter, stars } from '../ui/kit/display';
import { h, reducedMotion } from '../ui/kit/dom';
import { vibrate } from '../ui/haptics';
import { STRINGS } from '../ui/strings';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';
import { pickTip, type NightReport } from './nightLog';

export interface ResultsParams {
  levelId: string;
  result: LevelResult;
  report: NightReport;
  /** Star coins and unlocks (none for a debug night). */
  award?: NightAward;
}

function unlockText(unlock: Unlock): string {
  switch (unlock.kind) {
    case 'region':
      return STRINGS.unlockRegion(STRINGS.regionName[unlock.region]);
    case 'endless':
      return STRINGS.unlockEndless;
    case 'building':
      return STRINGS.unlockBuilding[unlock.building];
    case 'diary':
      return STRINGS.unlockDiary;
    case 'shop':
      return STRINGS.unlockShop(STRINGS.upgradeName[unlock.upgrade]);
  }
}

const minutes = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function createResultsScene(ctx: GameContext): Scene {
  return menuScene(ctx, (params) => {
    const { levelId, result, report, award } = params as unknown as ResultsParams;
    const starCoins = award?.starCoins ?? 0;
    const unlocks = award?.unlocks ?? [];
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
      starCoins > 0 ? h('dt', { textContent: STRINGS.resultsStarCoins }) : null,
      starCoins > 0 ? h('dd', {}, coinCounter(starCoins).element) : null,
      h('dt', { textContent: STRINGS.resultsCoins }),
      h('dd', {}, coinCounter(result.coins + starCoins).element),
    );
    const opened =
      unlocks.length > 0
        ? h(
            'div',
            { className: 'results__unlocks' },
            h('p', { className: 'eyebrow', textContent: STRINGS.resultsUnlocked }),
            h('ul', {}, ...unlocks.map((u) => h('li', { textContent: unlockText(u) }))),
          )
        : null;

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
                onStar: (n) => {
                  emitUi({ type: 'star', n });
                  if (ctx.settings.get().haptics) vibrate(UI_FEEL.haptics.star);
                },
              })
            : h('p', {
                className: 'results__tip',
                textContent: STRINGS.tip[pickTip(report, result.failReason)],
              }),
          stats,
          opened,
        ),
        h(
          'div',
          {
            className: 'results__actions',
            // The buttons fade in a beat after the last star lands.
            attrs: {
              style: `--actions-delay: ${
                won && !calm
                  ? UI_FEEL.starDelayMs +
                    Math.max(0, result.stars - 1) * UI_FEEL.starIntervalMs +
                    UI_FEEL.starHoldMs
                  : 0
              }ms`,
            },
          },
          ...actions,
        ),
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
