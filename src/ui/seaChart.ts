/**
 * The parchment sea chart behind the campaign map and level select, drawn as SVG: paper, a
 * coastline with hatching, a compass rose and rhumb lines (docs/ART_AUDIO.md: "an old sea chart").
 */
import { CHART } from '../data';
import { s } from './kit/dom';

const pathOf = (points: readonly (readonly [number, number])[]): string =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ') + ' Z';

function compass(x: number, y: number, r: number): SVGGElement {
  const g = s('g', { class: 'chart__compass', transform: `translate(${x} ${y})` });
  g.append(s('circle', { r, fill: 'none' }), s('circle', { r: r * 0.7, fill: 'none' }));
  for (let i = 0; i < 8; i++) {
    const long = i % 2 === 0;
    const len = long ? r * 1.1 : r * 0.65;
    const a = (i * Math.PI) / 4;
    const tip = `${Math.sin(a) * len} ${-Math.cos(a) * len}`;
    const side = (d: number): string =>
      `${Math.sin(a + d) * r * 0.16} ${-Math.cos(a + d) * r * 0.16}`;
    g.append(
      s('path', {
        d: `M${side(Math.PI / 2)} L${tip} L${side(-Math.PI / 2)} Z`,
        class: long ? 'long' : 'short',
      }),
    );
  }
  const north = s('text', { y: -r * 1.25, 'text-anchor': 'middle' });
  north.textContent = 'N';
  g.append(north);
  return g;
}

/** The chart drawing, scaled to cover its box. */
export function seaChart(): SVGSVGElement {
  const { width, height } = CHART;
  const svgEl = s('svg', {
    class: 'chart',
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': 'true',
  });
  const defs = s(
    'defs',
    {},
    s(
      'pattern',
      {
        id: 'chart-hatch',
        width: 2,
        height: 2,
        patternUnits: 'userSpaceOnUse',
        patternTransform: 'rotate(35)',
      },
      s('line', { x1: 0, y1: 0, x2: 0, y2: 2, class: 'chart__hatch' }),
    ),
    s(
      'radialGradient',
      { id: 'chart-vignette', cx: '50%', cy: '50%', r: '75%' },
      s('stop', { offset: '60%', 'stop-color': '#e8dfc8', 'stop-opacity': 0 }),
      s('stop', { offset: '100%', 'stop-color': '#a8916a', 'stop-opacity': 0.55 }),
    ),
  );
  svgEl.append(defs, s('rect', { width, height, class: 'chart__paper' }));

  // Rhumb lines from two compass points.
  const lines = s('g', { class: 'chart__rhumb' });
  for (const [cx, cy] of [
    [60, 100],
    [45, 30],
  ] as const) {
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      lines.append(
        s('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * 160, y2: cy + Math.sin(a) * 160 }),
      );
    }
  }
  svgEl.append(lines);

  // Depth soundings along the coast, then the land itself.
  const coast = pathOf(CHART.coast);
  svgEl.append(
    s('path', { d: coast, class: 'chart__shallows' }),
    s('path', { d: coast, class: 'chart__land' }),
    s('path', { d: coast, class: 'chart__land-hatch', fill: 'url(#chart-hatch)' }),
    compass(80, 126, 8),
    s('rect', { width, height, fill: 'url(#chart-vignette)' }),
  );
  return svgEl;
}
