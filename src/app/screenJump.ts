/**
 * Debug: ?screen=<name> opens one screen straight away, for play-testing it on its own.
 * Extra address options: &night=2-3 (briefing, results, shop), &region=stormStrait (level select),
 * &fail (results of a lost night).
 */
import type { SceneParams, StackEntry } from './sceneManager';
import { SCENE } from '../scenes/context';
import type { LevelResult } from '../sim/events';
import type { NightReport } from '../scenes/nightLog';

export interface ScreenJump {
  name: string;
  params: SceneParams;
  under: readonly StackEntry[];
}

const WON: LevelResult = {
  outcome: 'won',
  failReason: null,
  stars: 2,
  saved: 5,
  wrecked: 1,
  total: 6,
  coins: 70,
  caught: 0,
  escaped: 0,
  bonusMet: false,
  time: 74,
};

const FAILED: LevelResult = {
  ...WON,
  outcome: 'failed',
  stars: 0,
  saved: 2,
  wrecked: 4,
  coins: 20,
};

const DARK_WRECKS: NightReport = {
  wrecks: Array.from({ length: 4 }, () => ({
    shipType: 'fishing' as const,
    cause: 'reef' as const,
    darkSeconds: 8,
    litLate: false,
  })),
};

export function screenJump(params: URLSearchParams): ScreenJump | null {
  const name = params.get('screen');
  if (!name || !(Object.values(SCENE) as string[]).includes(name)) return null;
  const night = params.get('night') ?? '1-2';
  const title = { name: SCENE.title, params: {} };
  switch (name) {
    case SCENE.levelSelect:
      return { name, params: { region: params.get('region') ?? 'harborBay' }, under: [title] };
    case SCENE.briefing:
    case SCENE.shop:
      return { name, params: { levelId: night }, under: [title] };
    case SCENE.results: {
      const fail = params.has('fail');
      return {
        name,
        params: {
          levelId: night,
          result: fail ? FAILED : WON,
          report: fail ? DARK_WRECKS : { wrecks: [] },
        },
        under: [title],
      };
    }
    case SCENE.play:
    case SCENE.sandbox:
    case SCENE.boot:
      return null;
    default:
      return { name, params: {}, under: name === SCENE.title ? [] : [title] };
  }
}
