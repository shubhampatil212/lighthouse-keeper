/**
 * The play scene: one night of level 1-2.
 * Each tick: read the player's intents, step the world, hand its events to drawing and UI.
 */
import type { Renderer as PixiRenderer } from 'pixi.js';
import type { Scene } from '../app/sceneManager';
import type { Viewport } from '../app/viewport';
import {
  CONTROLS,
  ISLAND_BUILDINGS,
  LEVEL_1_2,
  NO_UPGRADES,
  PLAY,
  REGIONS,
  SHIP_TYPES,
  VIEWPORT,
  WEATHER_PRESETS,
} from '../data';
import type {
  IslandBuildingId,
  LevelDef,
  QualityProfile,
  RegionId,
  WeatherDef,
} from '../data/types';
import { createInputController, type InputController } from '../input/controller';
import type { ArtProvider } from '../render/art/types';
import { createSafeRing, drawSafeRing } from '../render/debug/safeRing';
import type { Layers } from '../render/layers';
import { createNightRenderer, type NightRenderer } from '../render/Renderer';
import { createWorld, type World } from '../sim/world';
import type { DebugPanel, DebugSettings } from '../ui/debugPanel';
import { createPlaytestUi } from '../ui/playtest';

export interface PlaySceneOptions {
  layers: Layers;
  pixi: PixiRenderer;
  art: ArtProvider;
  canvas: HTMLCanvasElement;
  uiRoot: HTMLElement;
  viewport: () => Viewport;
  showSafeRing: boolean;
  /** Seed for the first night (from ?seed=), or null for a random one. */
  seed: number | null;
  /** Debug settings to start with (from the address). */
  settings: DebugSettings;
  quality: QualityProfile;
  /** Island buildings earned so far (campaign progress arrives in phase 06). */
  buildings: readonly IslandBuildingId[];
  reducedMotion: boolean;
}

export interface PlayScene extends Scene {
  readonly settings: DebugSettings;
  applySettings(settings: DebugSettings): void;
  setQuality(profile: QualityProfile): void;
  /** Starts the night again, with the same seed or a new one. */
  restart(newSeed: boolean): void;
  attachDebugPanel(panel: DebugPanel): void;
}

/** A fresh seed for a new attempt. Randomness is fine here: the simulation only ever sees the seed. */
const randomSeed = (): number => Math.floor(Math.random() * 0x100000000);

function regionFor(level: LevelDef, settings: DebugSettings): RegionId {
  return settings.region === 'level' ? level.region : settings.region;
}

function weatherFor(level: LevelDef, settings: DebugSettings): WeatherDef {
  if (settings.weather !== 'level') return WEATHER_PRESETS[settings.weather];
  const region = regionFor(level, settings);
  return region === level.region && level.weather ? level.weather : REGIONS[region].weather;
}

export function createPlayScene(options: PlaySceneOptions): PlayScene {
  const { layers } = options;
  const level: LevelDef = LEVEL_1_2;
  const safeRing = options.showSafeRing ? createSafeRing() : null;
  const ui = createPlaytestUi(options.uiRoot, () => {
    restart(true);
  });
  ui.setLevel(level);

  let settings: DebugSettings = options.settings;
  let quality = options.quality;
  let seed = options.seed ?? randomSeed();
  let world: World = createWorld(level, settings.difficulty, NO_UPGRADES, seed);
  let view: NightRenderer | null = null;
  let input: InputController | null = null;
  let debugPanel: DebugPanel | null = null;
  let viewport: Viewport | null = null;
  let paused = false;
  let endCardIn: number | null = null;
  let lastFrame: number | null = null;

  const applyLook = (): void => {
    if (!view) return;
    view.setRegion(regionFor(level, settings));
    view.setWeather(weatherFor(level, settings));
    view.setBuildings(settings.allBuildings ? ISLAND_BUILDINGS : options.buildings);
    view.setParade(settings.parade);
    view.setRevealAll(settings.revealAll);
  };

  function restart(newSeed: boolean): void {
    if (newSeed) seed = randomSeed();
    world = createWorld(level, settings.difficulty, NO_UPGRADES, seed);
    paused = false;
    endCardIn = null;
    ui.hideEnd();
    view?.setNight(world);
  }

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
    setQuality(profile) {
      quality = profile;
      view?.setQuality(profile);
    },
    restart,
    attachDebugPanel(panel) {
      debugPanel = panel;
      panel.setSettings(settings);
    },
    enter() {
      view = createNightRenderer(options.pixi, layers, options.art, SHIP_TYPES);
      view.setQuality(quality);
      view.setReducedMotion(options.reducedMotion);
      if (viewport) view.resize(viewport);
      applyLook();
      restart(false);
      if (safeRing) layers.effects.addChild(safeRing);
      input = createInputController(options.canvas, window, options.viewport, CONTROLS);
      input.style = settings.style;
    },
    exit() {
      view?.destroy();
      view = null;
      safeRing?.removeFromParent();
      input?.dispose();
      input = null;
    },
    update(dt) {
      if (!input) return;
      const intents = input.read(world.state.beam);
      if (intents.pause && (paused || world.state.status === 'playing')) paused = !paused;
      if (paused) return;

      view?.capture(world);
      world.step(dt, intents);
      for (const event of world.drainEvents()) {
        view?.onEvent(event, world);
        if (event.type === 'levelEnded') endCardIn = PLAY.endCardDelay;
      }
      if (endCardIn !== null) {
        endCardIn -= dt;
        if (endCardIn <= 0 && world.state.result) {
          endCardIn = null;
          ui.showEnd(world.state.result);
        }
      }
    },
    render(alpha) {
      const now = performance.now();
      const frameSeconds = lastFrame === null ? 0 : Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;
      view?.draw(world, paused ? 1 : alpha, paused ? 0 : frameSeconds);
      const { state, setup } = world;
      ui.showHud({
        saved: state.saved,
        spareHulls: Math.max(0, setup.difficulty.wreckAllowance - state.wrecked),
        paused,
      });
      if (debugPanel?.open) debugPanel.showWorld(world, paused);
    },
    resize(vp: Viewport) {
      viewport = vp;
      view?.resize(vp);
      if (safeRing) drawSafeRing(safeRing, vp, VIEWPORT);
    },
  };
}
