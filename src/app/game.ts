/**
 * Puts the game together: the screens, how a night is started and finished, and how settings and
 * progress reach the screens that use them.
 */
import { CAMPAIGN } from '../data';
import type { LevelDef, Upgrades } from '../data/types';
import type { GameSettings } from '../data/uiTypes';
import type { Backdrop } from '../scenes/backdrop';
import { createBootScene } from '../scenes/boot';
import { createBriefingScene } from '../scenes/briefing';
import { SCENE, type GameContext } from '../scenes/context';
import { createCreditsScene } from '../scenes/credits';
import { createDifficultyScene } from '../scenes/difficulty';
import { createEndlessResultsScene } from '../scenes/endlessResults';
import { createLevelSelectScene } from '../scenes/levelSelect';
import { createLogbookScene } from '../scenes/logbook';
import { createMapScene } from '../scenes/map';
import type { PlayHooks, PlayScene } from '../scenes/play';
import { createResultsScene } from '../scenes/results';
import { createSettingsScene } from '../scenes/settings';
import { createShopScene } from '../scenes/shop';
import { createTitleScene } from '../scenes/title';
import type { BootScreen } from '../ui/bootScreen';
import { closeTopModal } from '../ui/kit/modal';
import { createSettingsPanel } from '../ui/settingsPanel';
import { STRINGS } from '../ui/strings';
import { createToast } from '../ui/toast';
import { levelDef, placeOf } from './campaign';
import { createNavigator } from './navigator';
import { NEW_PROGRESS, recordResult, upgradesFor, type Progress } from './progress';
import type { SceneManager, StackEntry } from './sceneManager';
import type { Store } from './store';

export interface GameParts {
  scenes: SceneManager;
  backdrop: Backdrop;
  uiRoot: HTMLElement;
  settings: Store<GameSettings>;
  progress: Store<Progress>;
  version: string;
  boot: BootScreen;
}

export interface Game {
  ctx: GameContext;
  hooks: PlayHooks;
  /** Registers the play scene (created by main, which owns its renderer options), or the sandbox. */
  registerPlay(play: PlayScene, name?: string): void;
  /** The screens under a night of `levelId`: Title, the chart, and its region's level select. */
  stackFor(levelId: string): StackEntry[];
}

export function createGame(parts: GameParts): Game {
  const { scenes, settings, progress } = parts;
  const nav = createNavigator(scenes);
  nav.closeDialog = closeTopModal;

  const stackFor = (levelId: string): StackEntry[] => {
    const region = placeOf(levelId)?.region.id ?? CAMPAIGN[0]?.id;
    return [
      { name: SCENE.title, params: {} },
      { name: SCENE.map, params: {} },
      { name: SCENE.levelSelect, params: { region } },
    ];
  };

  const ctx: GameContext = {
    nav,
    backdrop: parts.backdrop,
    uiRoot: parts.uiRoot,
    settings,
    progress,
    version: parts.version,
    startNight(levelId) {
      const level: LevelDef = levelDef(levelId);
      const upgrades: Upgrades = upgradesFor(progress.get(), levelId);
      void nav.reset(SCENE.play, { level, upgrades }, stackFor(levelId));
    },
    toast: createToast(parts.uiRoot),
  };

  const hooks: PlayHooks = {
    onNightEnd(level, result, report) {
      // Only campaign nights count towards progress (not debug demos).
      if (placeOf(level.id)) {
        progress.update((p) => recordResult(p, level.id, settings.get().difficulty, result));
      }
      void nav.reset(SCENE.results, { levelId: level.id, result, report }, stackFor(level.id));
    },
    onQuit() {
      void nav.reset(SCENE.map, {}, [{ name: SCENE.title, params: {} }]);
    },
    settingsPanel: () =>
      createSettingsPanel(settings, {
        inNight: true,
        onResetProgress: () => {
          progress.set(NEW_PROGRESS);
          ctx.toast(STRINGS.settingsResetToast);
        },
      }),
  };

  scenes.register(SCENE.boot, createBootScene(ctx, parts.boot));
  scenes.register(SCENE.title, createTitleScene(ctx));
  scenes.register(SCENE.difficulty, createDifficultyScene(ctx));
  scenes.register(SCENE.map, createMapScene(ctx));
  scenes.register(SCENE.levelSelect, createLevelSelectScene(ctx));
  scenes.register(SCENE.briefing, createBriefingScene(ctx));
  scenes.register(SCENE.results, createResultsScene(ctx));
  scenes.register(SCENE.endlessResults, createEndlessResultsScene(ctx));
  scenes.register(SCENE.shop, createShopScene(ctx));
  scenes.register(SCENE.logbook, createLogbookScene(ctx));
  scenes.register(SCENE.settings, createSettingsScene(ctx));
  scenes.register(SCENE.credits, createCreditsScene(ctx));

  return {
    ctx,
    hooks,
    registerPlay(play, name = SCENE.play) {
      scenes.register(name, play);
    },
    stackFor,
  };
}
