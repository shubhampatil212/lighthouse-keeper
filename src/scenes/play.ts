/**
 * The play scene (phase 02 version): one night of level 1-2 with debug graphics.
 * Each tick: read the player's intents, step the world, hand its events to drawing and UI.
 */
import type { Graphics } from 'pixi.js';
import type { Scene } from '../app/sceneManager';
import type { Viewport } from '../app/viewport';
import {
  CONTROLS,
  DEFAULT_DIFFICULTY,
  ISLAND,
  LEVEL_1_2,
  NO_UPGRADES,
  PLAY,
  VIEWPORT,
} from '../data';
import type { LevelDef } from '../data/types';
import { createInputController, type InputController } from '../input/controller';
import { createIsland } from '../render/art/island';
import { createBeam, drawBeam } from '../render/beam';
import { createSafeRing, drawSafeRing } from '../render/debug/safeRing';
import { createDebugWorldView } from '../render/debug/worldView';
import type { Layers } from '../render/layers';
import { createSea, drawSea } from '../render/sea';
import { lerpAngle } from '../sim/angle';
import { createWorld, type World } from '../sim/world';
import type { DebugPanel, DebugSettings } from '../ui/debugPanel';
import { createPlaytestUi } from '../ui/playtest';

export interface PlaySceneOptions {
  layers: Layers;
  canvas: HTMLCanvasElement;
  uiRoot: HTMLElement;
  viewport: () => Viewport;
  showSafeRing: boolean;
  /** Seed for the first night (from ?seed=), or null for a random one. */
  seed: number | null;
}

export interface PlayScene extends Scene {
  readonly settings: DebugSettings;
  applySettings(settings: DebugSettings): void;
  /** Starts the night again, with the same seed or a new one. */
  restart(newSeed: boolean): void;
  attachDebugPanel(panel: DebugPanel): void;
}

/** A fresh seed for a new attempt. Randomness is fine here: the simulation only ever sees the seed. */
const randomSeed = (): number => Math.floor(Math.random() * 0x100000000);

export function createPlayScene(options: PlaySceneOptions): PlayScene {
  const { layers } = options;
  const level: LevelDef = LEVEL_1_2;
  const sea = createSea();
  const island = createIsland(ISLAND);
  const beam = createBeam();
  const safeRing: Graphics | null = options.showSafeRing ? createSafeRing() : null;
  const view = createDebugWorldView(layers);
  const ui = createPlaytestUi(options.uiRoot, () => {
    restart(true);
  });
  ui.setLevel(level);

  let settings: DebugSettings = {
    revealAll: false,
    style: CONTROLS.defaultStyle,
    difficulty: DEFAULT_DIFFICULTY,
  };
  view.revealAll = settings.revealAll;
  let seed = options.seed ?? randomSeed();
  let world: World = createWorld(level, settings.difficulty, NO_UPGRADES, seed);
  let input: InputController | null = null;
  let debugPanel: DebugPanel | null = null;
  let previousBeam = world.state.beam.angle;
  let paused = false;
  let endCardIn: number | null = null;
  let lastFrame: number | null = null;

  function restart(newSeed: boolean): void {
    if (newSeed) seed = randomSeed();
    world = createWorld(level, settings.difficulty, NO_UPGRADES, seed);
    previousBeam = world.state.beam.angle;
    paused = false;
    endCardIn = null;
    ui.hideEnd();
    drawBeam(beam, world.setup.beam);
    view.capture(world);
  }

  return {
    get settings() {
      return settings;
    },
    applySettings(next) {
      const restartNeeded = next.difficulty !== settings.difficulty;
      settings = next;
      view.revealAll = next.revealAll;
      if (input) input.style = next.style;
      if (restartNeeded) restart(false);
    },
    restart,
    attachDebugPanel(panel) {
      debugPanel = panel;
      panel.setSettings(settings);
    },
    enter() {
      restart(false);
      layers.water.addChild(sea);
      layers.island.addChild(island);
      layers.lightFx.addChild(beam);
      if (safeRing) layers.effects.addChild(safeRing);
      input = createInputController(options.canvas, window, options.viewport, CONTROLS);
      input.style = settings.style;
    },
    exit() {
      sea.removeFromParent();
      island.removeFromParent();
      beam.removeFromParent();
      safeRing?.removeFromParent();
      input?.dispose();
      input = null;
    },
    update(dt) {
      if (!input) return;
      const intents = input.read(world.state.beam);
      if (intents.pause && (paused || world.state.status === 'playing')) paused = !paused;
      if (paused) return;

      view.capture(world);
      previousBeam = world.state.beam.angle;
      world.step(dt, intents);
      for (const event of world.drainEvents()) {
        view.onEvent(event);
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
      const blend = paused ? 1 : alpha;
      beam.rotation = lerpAngle(previousBeam, world.state.beam.angle, blend);
      view.draw(world, blend, paused ? 0 : frameSeconds);
      const { state, setup } = world;
      ui.showHud({
        saved: state.saved,
        spareHulls: Math.max(0, setup.difficulty.wreckAllowance - state.wrecked),
        paused,
      });
      if (debugPanel?.open) debugPanel.showWorld(world, paused);
    },
    resize(vp: Viewport) {
      drawSea(sea, vp);
      view.setPixelSize(1 / vp.scale);
      if (safeRing) drawSafeRing(safeRing, vp, VIEWPORT);
    },
  };
}
