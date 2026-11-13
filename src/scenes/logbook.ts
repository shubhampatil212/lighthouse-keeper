/**
 * The keeper's logbook: Diary (one page per finished region), Ships and Hazards (drawings, dark
 * silhouettes until met) and Records (docs/SCREENS.md "Logbook").
 */
import { ALL_LEVELS } from '../app/campaign';
import { isCleared, regionsComplete, totalStars, type Progress } from '../app/progress';
import type { Scene } from '../app/sceneManager';
import { CAMPAIGN } from '../data';
import type { DifficultyId, ShipTypeId } from '../data/types';
import type { IntroId, SeaFeatureId } from '../data/uiTypes';
import { screenHeader } from '../ui/header';
import { illustration } from '../ui/illustrations';
import { tabs } from '../ui/kit/display';
import { h } from '../ui/kit/dom';
import { STRINGS } from '../ui/strings';
import type { GameContext } from './context';
import { menuScene } from './menuScene';

const SHIPS: readonly ShipTypeId[] = [
  'fishing',
  'cargo',
  'sailboat',
  'ferry',
  'tugboat',
  'smuggler',
];
const FEATURES: readonly SeaFeatureId[] = [
  'reef',
  'current',
  'fogBand',
  'iceberg',
  'lightning',
  'stormWaves',
  'whirlpool',
  'pirate',
  'secondHarbor',
];
/** Things on the sea from the very first night. */
const FROM_START: readonly IntroId[] = ['fishing', 'reef', 'current'];

/** Met once the level that brings it in has been reached (its predecessor cleared, or it is). */
function discovered(p: Progress, id: IntroId): boolean {
  if (FROM_START.includes(id)) return p.started;
  const i = ALL_LEVELS.findIndex((l) => l.introduces === id || l.alsoIntroduces === id);
  const level = ALL_LEVELS[i];
  if (!level) return false;
  const before = ALL_LEVELS[i - 1];
  return isCleared(p, level.id) || (before !== undefined && isCleared(p, before.id));
}

function entries(p: Progress, ids: readonly (ShipTypeId | SeaFeatureId)[]): HTMLElement {
  return h(
    'ul',
    { className: 'log-entries' },
    ...ids.map((id) => {
      const known = discovered(p, id);
      return h(
        'li',
        { className: `log-entry${known ? '' : ' is-unknown'}` },
        illustration(id, { silhouette: !known }),
        h(
          'div',
          {},
          h('h2', { textContent: known ? STRINGS.intro[id].name : STRINGS.logUnknown }),
          h('p', { textContent: known ? STRINGS.logDetail[id] : STRINGS.logUnknownLine }),
        ),
      );
    }),
  );
}

function diary(p: Progress): HTMLElement {
  const unlocked = regionsComplete(p);
  return h(
    'div',
    { className: 'log-diary' },
    ...CAMPAIGN.map((region, i) => {
      const page = STRINGS.diary[region.id];
      return i < unlocked
        ? h(
            'article',
            { className: 'diary-page' },
            h('h2', { textContent: page.title }),
            ...page.text.map((para) => h('p', { textContent: para })),
          )
        : h(
            'article',
            { className: 'diary-page is-locked' },
            h('h2', { textContent: STRINGS.diaryLockedTitle }),
            h('p', { textContent: STRINGS.diaryLocked(STRINGS.regionName[region.id]) }),
          );
    }),
  );
}

function records(p: Progress): HTMLElement {
  const max = ALL_LEVELS.length * 3;
  const row = (label: string, value: string): HTMLElement[] => [
    h('dt', { textContent: label }),
    h('dd', { textContent: value }),
  ];
  const diffs: readonly DifficultyId[] = ['calm', 'keeper', 'storm'];
  return h(
    'dl',
    { className: 'log-records' },
    ...diffs.flatMap((d) =>
      row(STRINGS.recordStars(STRINGS.difficultyName[d]), STRINGS.starCount(totalStars(p, d), max)),
    ),
    ...row(STRINGS.recordEndless, p.endlessBest > 0 ? String(p.endlessBest) : STRINGS.recordNone),
    ...row(STRINGS.recordSaved, String(p.shipsSaved)),
  );
}

export function createLogbookScene(ctx: GameContext): Scene {
  return menuScene(ctx, () => {
    const p = ctx.progress.get();
    const root = h(
      'main',
      { className: 'menu-screen menu-screen--top logbook' },
      screenHeader(STRINGS.logbookTitle, () => {
        ctx.nav.back();
      }),
      h(
        'div',
        { className: 'menu-column menu-column--scroll' },
        tabs(STRINGS.logbookTitle, [
          { id: 'diary', label: STRINGS.logDiary, render: () => diary(p) },
          { id: 'ships', label: STRINGS.logShips, render: () => entries(p, SHIPS) },
          { id: 'hazards', label: STRINGS.logHazards, render: () => entries(p, FEATURES) },
          { id: 'records', label: STRINGS.logRecords, render: () => records(p) },
        ]),
      ),
    );
    return { root };
  });
}
