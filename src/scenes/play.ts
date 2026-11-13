/**
 * The play scene: one night. Each tick: read the player's intents, step the world, and hand its
 * events to drawing, the HUD's prompts and the night log. When the night ends it reports to the
 * game (which opens Results); back or Esc opens Pause.
 */
import { isWatchId } from '../app/endless';
import type { Viewport } from '../app/viewport';
import {
  ABILITIES,
  CONTROLS,
  ISLAND_BUILDINGS,
  NO_UPGRADES,
  PLAY,
  SHIP_TYPES,
  VIEWPORT,
} from '../data';
import type { LevelDef, TutorialPromptId, Upgrades, WatchDef } from '../data/types';
import { createInputController, type InputController } from '../input/controller';
import { createSafeRing, drawSafeRing } from '../render/debug/safeRing';
import { createNightRenderer, type NightRenderer } from '../render/Renderer';
import { foghornCooldown } from '../sim/abilities';
import { createWorld, type World, type WorldOptions } from '../sim/world';
import type { DebugPanel } from '../ui/debugPanel';
import { createHud } from '../ui/hud';
import { createPauseMenu } from '../ui/pauseMenu';
import { STRINGS } from '../ui/strings';
import { createNightLog, type NightLog } from './nightLog';
import type { PlayScene, PlaySceneOptions } from './playTypes';
import { regionFor, weatherFor } from './playLook';
import { createPlayHints } from './playHints';
import { createTutorial, type Tutorial } from './tutorial';

export type { PlayHooks, PlayPrefs, PlayScene, PlaySceneOptions } from './playTypes';

const NO_ACTIONS = { foghorn: false, flare: false, switchLamp: false };

/** The HUD's level code ("2-3"); an endless watch shows only its name. */
const levelCode = (level: LevelDef): string => (isWatchId(level.id) ? '' : level.id);

/** A fresh seed for a new attempt. Randomness is fine here: the simulation only ever sees the seed. */
const randomSeed = (): number => Math.floor(Math.random() * 0x100000000);

export function createPlayScene(options: PlaySceneOptions): PlayScene {
  const { layers, hooks } = options;
  let level = options.level;
  let upgrades: Upgrades = options.upgrades ?? NO_UPGRADES;
  let prefs = options.prefs;
  let worldOptions: WorldOptions = { endless: options.endless ?? false };
  /** A daily sea keeps its seed on every attempt. */
  let fixedSeed: number | null = null;
  const safeRing = options.showSafeRing ? createSafeRing() : null;
  const hud = createHud(
    () => {
      setPaused(true);
    },
    (action) => input?.press(action),
  );
  const pause = createPauseMenu(options.uiRoot, {
    resume: () => {
      setPaused(false);
    },
    restart: () => {
      restart(true);
    },
    quit: () => hooks?.onQuit(),
    settingsPanel: () => hooks?.settingsPanel() ?? document.createElement('div'),
  });
  const hints = createPlayHints(() => prefs.tutorialPrompts);

  let settings = options.settings;
  let quality = options.quality;
  let seed = options.seed ?? randomSeed();
  let world: World = createWorld(level, settings.difficulty, upgrades, seed, worldOptions);
  let log: NightLog = createNightLog(1 / 60);
  let tutorial: Tutorial | null = null;
  let view: NightRenderer | null = null;
  let input: InputController | null = null;
  let debugPanel: DebugPanel | null = null;
  let viewport: Viewport | null = null;
  let paused = false;
  let endIn: number | null = null;
  let lastFrame: number | null = null;
  let timeScale = 1;
  let stepDebt = 0;
  let held = { ...NO_ACTIONS };
  /** The first night keeps ?seed= from the address; every later one gets a fresh seed. */
  let firstNight = true;

  /** Where the lamp the player steers stands on screen: the pointer aims around it. */
  const aimCenter = (): { centerX: number; centerY: number } => {
    const vp = options.viewport();
    const lamp = world.state.activeLamp === 1 ? world.state.lamp2 : null;
    return lamp
      ? { centerX: vp.centerX + lamp.x * vp.scale, centerY: vp.centerY + lamp.y * vp.scale }
      : vp;
  };

  const applyLook = (): void => {
    if (!view) return;
    view.setRegion(regionFor(level, settings));
    view.setWeather(weatherFor(level, settings));
    view.setBuildings(settings.allBuildings ? ISLAND_BUILDINGS : prefs.buildings);
    view.setParade(settings.parade);
    view.setRevealAll(settings.revealAll);
    view.setColorblind(settings.colorblind);
    view.setReducedMotion(prefs.reducedMotion || !prefs.screenShake);
    hud.setLeftHanded(prefs.leftHanded);
  };

  const fitArrows = (): void => {
    const { top, bottom } = hud.insets();
    view?.setHudInsets(top, bottom);
  };

  function setPaused(on: boolean): void {
    if (on && world.state.status !== 'playing') return;
    paused = on;
    if (!hooks) return;
    if (on) pause.show();
    else pause.hide();
  }

  function restart(newSeed: boolean): void {
    if (fixedSeed !== null) seed = fixedSeed;
    else if (newSeed) seed = randomSeed();
    world = createWorld(level, settings.difficulty, upgrades, seed, worldOptions);
    log = createNightLog(1 / 60);
    tutorial = level.tutorial && prefs.tutorialPrompts ? createTutorial(level.tutorial) : null;
    hints.clear();
    hints.onNightStart(level, world.setup.upgrades);
    hud.prompt(null);
    setPaused(false);
    endIn = null;
    view?.setNight(world);
  }

  const load = (nextLevel: LevelDef, nextUpgrades: Upgrades): void => {
    level = nextLevel;
    upgrades = nextUpgrades;
    hud.setLevel(levelCode(nextLevel), nextLevel.name);
    applyLook();
    restart(false);
  };
  hud.setLevel(levelCode(level), level.name);

  const tutorialText = (id: TutorialPromptId): string => {
    if (id !== 'swingBeam') return STRINGS.tutorial[id];
    return settings.style === 'drag'
      ? STRINGS.tutorial.swingBeamDrag
      : STRINGS.tutorial.swingBeamFollow;
  };

  return {
    get settings() {
      return settings;
    },
    applySettings(next) {
      const restartNeeded = next.difficulty !== settings.difficulty;
      settings = next;
      if (input) input.style = next.style;
      applyLook();
      if (restartNeeded) restart(false);
    },
    applyPrefs(next) {
      prefs = next;
      applyLook();
    },
    setQuality(profile) {
      quality = profile;
      view?.setQuality(profile);
    },
    restart,
    get world() {
      return world;
    },
    load,
    get timeScale() {
      return timeScale;
    },
    set timeScale(scale) {
      timeScale = Math.max(0, scale);
    },
    press(action) {
      input?.press(action);
    },
    attachDebugPanel(panel) {
      debugPanel = panel;
      panel.setSettings(settings);
    },
    enter(params) {
      options.backdrop?.hide();
      if (params.level) {
        level = params.level as LevelDef;
        upgrades = (params.upgrades as Upgrades | undefined) ?? NO_UPGRADES;
        const watch = params.watch as WatchDef | undefined;
        worldOptions = watch ? { watch } : { endless: options.endless ?? false };
        fixedSeed = (params.seed as number | null | undefined) ?? null;
        hud.setLevel(levelCode(level), level.name);
      }
      view = createNightRenderer(options.pixi, layers, options.art, SHIP_TYPES);
      view.setQuality(quality);
      if (viewport) view.resize(viewport);
      applyLook();
      restart(!firstNight || options.seed === null);
      firstNight = false;
      options.uiRoot.append(hud.element);
      requestAnimationFrame(fitArrows);
      if (safeRing) layers.effects.addChild(safeRing);
      input = createInputController(options.canvas, window, aimCenter, CONTROLS);
      input.style = settings.style;
    },
    exit() {
      pause.hide();
      hud.element.remove();
      view?.destroy();
      view = null;
      safeRing?.removeFromParent();
      input?.dispose();
      input = null;
    },
    back() {
      setPaused(world.state.status === 'playing' && !paused);
      return true;
    },
    update(dt) {
      if (!input) return;
      const { state } = world;
      const read = input.read(state.activeLamp === 1 && state.lamp2 ? state.lamp2 : state.beam);
      // In slow motion a tick may pass with no step: keep button presses until a step uses them.
      const intents = {
        ...read,
        foghorn: read.foghorn || held.foghorn,
        flare: read.flare || held.flare,
        switchLamp: read.switchLamp || held.switchLamp,
      };
      if (intents.pause) setPaused(!paused);
      if (paused) return;
      // The tutorial may swing the beam for the player for a moment.
      const lesson = tutorial?.step(dt) ?? null;
      if (lesson?.steer != null) intents.aimAngle = lesson.steer;

      // Slow motion and fast forward (sandbox): run 0..n fixed steps for each real one.
      stepDebt += timeScale;
      held = stepDebt >= 1 ? { ...NO_ACTIONS } : intents;
      let first = true;
      while (stepDebt >= 1) {
        stepDebt -= 1;
        view?.capture(world);
        world.step(dt, first ? intents : { ...intents, ...NO_ACTIONS });
        first = false;
        for (const event of world.drainEvents()) {
          view?.onEvent(event, world);
          log.onEvent(event);
          hints.onEvent(event);
          tutorial?.onEvent(event);
          if (event.type === 'levelEnded') endIn = PLAY.endCardDelay;
        }
      }
      const hint = hints.step(dt);
      const lessonText = lesson?.prompt ? tutorialText(lesson.prompt) : null;
      hud.prompt(lessonText ?? (hint ? STRINGS.hint[hint] : null));
      if (endIn !== null) {
        endIn -= dt;
        if (endIn <= 0 && world.state.result) {
          endIn = null;
          hooks?.onNightEnd(level, world.state.result, log.report());
        }
      }
    },
    render(alpha) {
      const now = performance.now();
      const frameSeconds = lastFrame === null ? 0 : Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;
      view?.draw(world, paused ? 1 : alpha, paused ? 0 : frameSeconds);
      const { state, setup } = world;
      const owned = setup.upgrades;
      hud.update({
        spawned: state.spawnIndex,
        total: setup.endless ? 0 : setup.spawns.length,
        saved: state.saved,
        allowance: setup.difficulty.wreckAllowance,
        wrecked: state.wrecked,
        caught: state.caught,
        foghorn:
          owned.foghorn > 0
            ? {
                cooldown: state.abilities.foghornCooldown,
                full: foghornCooldown(ABILITIES.foghorn, owned.foghorn),
              }
            : null,
        flares: owned.flares > 0 ? state.abilities.flares : null,
        lamp: state.lamp2 ? state.activeLamp : null,
      });
      if (debugPanel?.open) debugPanel.showWorld(world, paused);
    },
    resize(vp: Viewport) {
      viewport = vp;
      view?.resize(vp);
      fitArrows();
      if (safeRing) drawSafeRing(safeRing, vp, VIEWPORT);
    },
  };
}
