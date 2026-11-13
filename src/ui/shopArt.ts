/**
 * The Harbor shop's pictures, drawn as SVG: the lighthouse by day (its lens grows with each
 * "Wider lens", its lamp glows brighter with each "Brighter lamp"), and the mini chart of the next
 * night's reefs for placing bell buoys.
 */
import { BEAM } from '../data';
import type { LevelDef } from '../data/types';
import type { UpgradeId } from '../data/uiTypes';
import { s } from './kit/dom';

export interface LighthouseArt {
  element: SVGSVGElement;
  show(levels: Readonly<Record<UpgradeId, number>>, celebrate: boolean): void;
}

export function lighthouseArt(): LighthouseArt {
  const glow = s('circle', { cx: 50, cy: 30, class: 'lh-glow' });
  const lens = s('ellipse', { cx: 50, cy: 30, class: 'lh-lens' });
  const gears = s('g', { class: 'lh-gears' });
  const element = s(
    'svg',
    { viewBox: '0 0 100 100', class: 'lighthouse-art', 'aria-hidden': 'true' },
    s('rect', { width: 100, height: 100, class: 'lh-sky' }),
    s('path', { d: 'M0 80c14-4 26-4 40 0s26 4 40 0 14-3 20-1V100H0z', class: 'lh-sea' }),
    s('path', { d: 'M18 84c4-12 16-18 32-18s28 6 32 18z', class: 'lh-rock' }),
    s('path', { d: 'M40 74l4-36h12l4 36z', class: 'lh-tower' }),
    s('path', { d: 'M42.6 50h14.8l.8 8H41.8zM41 66h18l.6 6H40.4z', class: 'lh-stripe' }),
    s('rect', { x: 41, y: 36, width: 18, height: 3, class: 'lh-gallery' }),
    s('rect', { x: 44.5, y: 25, width: 11, height: 11, class: 'lh-glass' }),
    glow,
    lens,
    s('path', { d: 'M43 25h14l-2-6H45z', class: 'lh-roof' }),
    gears,
  );
  return {
    element,
    show(levels, celebrate) {
      lens.setAttribute('rx', String(3.5 + levels.lens * 0.7));
      lens.setAttribute('ry', '4.2');
      glow.setAttribute('r', String(7 + levels.lamp * 2.4));
      glow.setAttribute('opacity', String(0.25 + levels.lamp * 0.08));
      gears.replaceChildren(
        ...Array.from({ length: levels.gears }, (_, i) =>
          s('circle', { cx: 46 + i * 2.7, cy: 45, r: 1, class: 'lh-gear' }),
        ),
      );
      if (celebrate) {
        element.classList.remove('is-upgraded');
        void element.getBoundingClientRect();
        element.classList.add('is-upgraded');
      }
    },
  };
}

/** World units → mini chart units: the 230 wu safe circle fits a 100-unit box. */
const CHART_SCALE = 46 / 230;

export interface ReefSpot {
  index: number;
  x: number;
  y: number;
}

/** The reefs of `level` as spots on a 100×100 chart (island at the centre). */
export function reefSpots(level: LevelDef): ReefSpot[] {
  return level.reefs.map((reef, index) => ({
    index,
    x: 50 + reef.x * CHART_SCALE,
    y: 50 + reef.y * CHART_SCALE,
  }));
}

/** The mini chart's background: water, the beam's base reach, and the island. */
export function miniChart(): SVGSVGElement {
  return s(
    'svg',
    { viewBox: '0 0 100 100', class: 'mini-chart__map', 'aria-hidden': 'true' },
    s('circle', { cx: 50, cy: 50, r: 48, class: 'mini-chart__sea' }),
    s('circle', { cx: 50, cy: 50, r: BEAM.range * CHART_SCALE, class: 'mini-chart__ring' }),
    s('circle', { cx: 50, cy: 50, r: 6, class: 'mini-chart__island' }),
  );
}
