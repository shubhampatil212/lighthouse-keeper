/**
 * Level select: a region's six levels as buoys along a dotted route, each with its stars or a lock
 * (docs/SCREENS.md "Level select"). Tapping one opens its briefing.
 */
import { bestStars, currentLevelId, isLevelUnlocked } from '../app/progress';
import type { Scene } from '../app/sceneManager';
import { CAMPAIGN, CHART } from '../data';
import type { RegionId } from '../data/types';
import { screenHeader } from '../ui/header';
import { coinCounter, stars } from '../ui/kit/display';
import { h, s, svg } from '../ui/kit/dom';
import { ICONS } from '../ui/kit/icons';
import { seaChart } from '../ui/seaChart';
import { STRINGS } from '../ui/strings';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';

export function createLevelSelectScene(ctx: GameContext): Scene {
  return menuScene(
    ctx,
    (params) => {
      const region = CAMPAIGN.find((r) => r.id === (params.region as RegionId)) ?? CAMPAIGN[0];
      if (!region) throw new Error('No campaign regions');
      const progress = ctx.progress.get();
      const current = currentLevelId(progress);
      const frame = h('div', { className: 'chart-frame' }, seaChart());

      // The dotted route through the six buoys (chart coordinates: % of width, % of height).
      const route = s('svg', {
        class: 'route',
        viewBox: '0 0 100 100',
        preserveAspectRatio: 'none',
        'aria-hidden': 'true',
      });
      route.append(
        s('polyline', {
          points: CHART.route.map(([x, y]) => `${x},${y}`).join(' '),
          class: 'route__line',
          'vector-effect': 'non-scaling-stroke',
        }),
      );
      frame.append(route);

      const list = h('ol', { className: 'route-buoys' });
      region.levels.forEach((level, i) => {
        const [x, y] = CHART.route[i] ?? [50, 50];
        const open = isLevelUnlocked(progress, level.id);
        const got = bestStars(progress, level.id);
        const b = h(
          'button',
          {
            type: 'button',
            className: `route-buoy${open ? '' : ' is-locked'}${level.id === current ? ' is-next' : ''}`,
            attrs: {
              'aria-label': open
                ? STRINGS.levelLabel(level.id, level.name, got)
                : STRINGS.levelLockedLabel(level.id, level.name),
            },
          },
          h(
            'span',
            { className: 'route-buoy__mark' },
            open ? h('span', { textContent: String(i + 1) }) : svg(ICONS.lock),
          ),
          h('span', { className: 'route-buoy__name', textContent: level.name }),
          open
            ? stars(got)
            : h('span', { className: 'route-buoy__locked', textContent: STRINGS.locked }),
        );
        if (level.id === current || (i === 0 && !region.levels.some((l) => l.id === current))) {
          b.dataset.autofocus = '';
        }
        b.addEventListener('click', () => {
          if (open) void ctx.nav.go(SCENE.briefing, { levelId: level.id });
          else ctx.toast(STRINGS.levelLockedHint);
        });
        const item = h('li', { className: 'route-buoys__item' }, b);
        item.style.left = `${x}%`;
        item.style.top = `${y}%`;
        list.append(item);
      });
      frame.append(list);

      const root = h(
        'main',
        { className: 'parchment-screen' },
        screenHeader(
          STRINGS.regionName[region.id],
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
