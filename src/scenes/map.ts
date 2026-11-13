/**
 * Campaign map: the parchment sea chart with the five regions; locked ones lie under fog
 * (docs/SCREENS.md "Campaign map"). Tapping a region opens its level select.
 */
import { placeOf } from '../app/campaign';
import { currentLevelId, isRegionUnlocked, regionStars } from '../app/progress';
import type { Scene } from '../app/sceneManager';
import { CAMPAIGN } from '../data';
import { screenHeader } from '../ui/header';
import { coinCounter } from '../ui/kit/display';
import { h, svg } from '../ui/kit/dom';
import { ICONS } from '../ui/kit/icons';
import { seaChart } from '../ui/seaChart';
import { STRINGS } from '../ui/strings';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';

export function createMapScene(ctx: GameContext): Scene {
  return menuScene(
    ctx,
    () => {
      const progress = ctx.progress.get();
      const here = placeOf(currentLevelId(progress))?.regionIndex ?? 0;
      const frame = h('div', { className: 'chart-frame' }, seaChart());

      CAMPAIGN.forEach((region, i) => {
        const open = isRegionUnlocked(progress, i);
        const { got, max } = regionStars(progress, region.id);
        const name = STRINGS.regionName[region.id];
        const spot = h('div', {
          className: `chart-region${open ? '' : ' is-locked'}${i === here ? ' is-here' : ''}`,
        });
        spot.style.left = `${region.chart.x}%`;
        spot.style.top = `${region.chart.y}%`;
        if (!open)
          spot.append(h('div', { className: 'chart-fog', attrs: { 'aria-hidden': 'true' } }));
        const b = h(
          'button',
          {
            type: 'button',
            className: 'chart-region__button',
            attrs: {
              'aria-label': open
                ? STRINGS.mapRegionLabel(name, got, max)
                : STRINGS.mapRegionLocked(name),
            },
          },
          h('span', { className: 'chart-region__mark' }, svg(open ? ICONS.anchor : ICONS.lock)),
          h('span', { className: 'chart-region__name', textContent: name }),
          h(
            'span',
            { className: 'chart-region__stars' },
            open ? svg(ICONS.star) : null,
            open ? STRINGS.starCount(got, max) : STRINGS.locked,
          ),
        );
        if (i === here) b.dataset.autofocus = '';
        b.addEventListener('click', () => {
          if (open) void ctx.nav.go(SCENE.levelSelect, { region: region.id });
          else
            ctx.toast(STRINGS.mapLockedHint(STRINGS.regionName[CAMPAIGN[i - 1]?.id ?? region.id]));
        });
        spot.append(b);
        frame.append(spot);
      });

      const root = h(
        'main',
        { className: 'parchment-screen' },
        screenHeader(
          STRINGS.mapTitle,
          () => {
            ctx.nav.back();
          },
          coinCounter(progress.coins).element,
        ),
        h('div', { className: 'chart-holder' }, frame),
      );
      return { root };
    },
    { backdrop: false },
  );
}
