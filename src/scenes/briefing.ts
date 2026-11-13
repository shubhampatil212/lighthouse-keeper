/**
 * Briefing: the level's name, a line from the harbor master, what's new tonight (with a small
 * animated drawing), the bonus objective and the abilities on hand (docs/SCREENS.md "Briefing").
 */
import { levelDef, placeOf } from '../app/campaign';
import type { IntroId } from '../data/uiTypes';
import { bestStars } from '../app/progress';
import type { Scene } from '../app/sceneManager';
import { illustration } from '../ui/illustrations';
import { button } from '../ui/kit/controls';
import { card, stars } from '../ui/kit/display';
import { h, svg } from '../ui/kit/dom';
import { ICONS, type IconId } from '../ui/kit/icons';
import { screenHeader } from '../ui/header';
import { STRINGS } from '../ui/strings';
import type { GameContext } from './context';
import { menuScene } from './menuScene';

export function createBriefingScene(ctx: GameContext): Scene {
  return menuScene(ctx, (params) => {
    const levelId = typeof params.levelId === 'string' ? params.levelId : '1-1';
    const level = levelDef(levelId);
    const place = placeOf(levelId);
    const progress = ctx.progress.get();
    const difficulty = ctx.settings.get().difficulty;
    ctx.backdrop.setRegion(level.region);

    const intros = [place?.level.introduces, place?.level.alsoIntroduces].filter(
      (id): id is IntroId => id !== null && id !== undefined,
    );
    const news = intros.map((intro) =>
      h(
        'div',
        { className: 'briefing__new' },
        illustration(intro, { animate: true }),
        h(
          'div',
          {},
          h('p', { className: 'eyebrow', textContent: STRINGS.briefingNew }),
          h('p', { className: 'briefing__new-name', textContent: STRINGS.intro[intro].name }),
          h('p', { className: 'briefing__new-line', textContent: STRINGS.intro[intro].line }),
        ),
      ),
    );

    const abilities: [IconId, string][] = [];
    if (progress.upgrades.foghorn > 0) abilities.push(['horn', STRINGS.abilityFoghorn]);
    if (progress.upgrades.flares > 0) {
      abilities.push(['flare', STRINGS.briefingFlares(progress.upgrades.flares)]);
    }
    if (level.secondLamp) abilities.push(['lamp', STRINGS.abilitySwitchLamp]);
    const buoys = progress.buoys[levelId]?.length ?? 0;
    if (buoys > 0) abilities.push(['buoy', STRINGS.briefingBuoys(buoys)]);

    const go = button(
      STRINGS.briefingGo,
      () => {
        ctx.startNight(levelId);
      },
      {
        variant: 'primary',
        icon: 'lamp',
      },
    );
    go.dataset.autofocus = '';

    const root = h(
      'main',
      { className: 'menu-screen menu-screen--top' },
      screenHeader(STRINGS.levelCode(levelId), () => {
        ctx.nav.back();
      }),
      h(
        'div',
        { className: 'menu-column' },
        card(
          'briefing',
          h('h2', { className: 'briefing__name', textContent: level.name }),
          h('p', { className: 'briefing__quote', textContent: STRINGS.briefingLine(levelId) }),
          ...news,
          h(
            'dl',
            { className: 'briefing__facts' },
            h('dt', { textContent: STRINGS.briefingBonus }),
            h('dd', { textContent: STRINGS.bonus(level.bonus) ?? STRINGS.briefingNoBonus }),
            h('dt', { textContent: STRINGS.briefingAbilities }),
            h(
              'dd',
              { className: 'briefing__abilities' },
              abilities.length === 0
                ? STRINGS.briefingJustBeam
                : h(
                    'ul',
                    {},
                    ...abilities.map(([icon, text]) => h('li', {}, svg(ICONS[icon]), text)),
                  ),
            ),
            h('dt', { textContent: STRINGS.briefingBest(STRINGS.difficultyName[difficulty]) }),
            h('dd', {}, stars(bestStars(progress, levelId, difficulty))),
          ),
        ),
        go,
      ),
    );
    return { root };
  });
}
