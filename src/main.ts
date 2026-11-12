/** Boot: create the Pixi renderer, viewport, game loop and scene manager, then open the first scene. */
import { Application } from 'pixi.js';
import './ui/tokens.css';
import './ui/base.css';
import { createFadeTransition } from './app/fade';
import { createGameLoop } from './app/gameLoop';
import { createSceneManager } from './app/sceneManager';
import type { Viewport } from './app/viewport';
import { watchViewport } from './app/viewportWatcher';
import { DEFAULT_QUALITY, LOOP, QUALITY, SCENE_TRANSITION, VIEWPORT } from './data';
import { applyViewport, createLayers } from './render/layers';
import { PALETTE } from './render/palette';
import { SCENE } from './scenes';
import { createPlayScene } from './scenes/play';
import { createDebugPanel } from './ui/debugPanel';
import { STRINGS } from './ui/strings';

function requireElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
}

async function boot(): Promise<void> {
  const host = requireElement('stage');
  const fade = requireElement('fade');
  const params = new URLSearchParams(location.search);
  const debug = params.has('debug');
  const seedParam = Number.parseInt(params.get('seed') ?? '', 10);

  const app = new Application();
  let onViewport: (vp: Viewport) => void = () => undefined;
  const viewport = watchViewport(VIEWPORT, QUALITY[DEFAULT_QUALITY].maxPixelRatio, (vp) => {
    onViewport(vp);
  });
  const first = viewport.current;

  await app.init({
    width: first.width,
    height: first.height,
    resolution: first.resolution,
    autoDensity: true,
    antialias: true,
    autoStart: false,
    sharedTicker: false,
    background: PALETTE.seaDeep,
  });
  app.ticker.stop();
  app.canvas.setAttribute('aria-label', STRINGS.canvasLabel);
  app.canvas.setAttribute('role', 'img');
  host.appendChild(app.canvas);

  const layers = createLayers(app.stage);
  const scenes = createSceneManager(
    createFadeTransition(fade, SCENE_TRANSITION.fadeMs),
    () => viewport.current,
  );
  const play = createPlayScene({
    layers,
    canvas: app.canvas,
    uiRoot: document.body,
    viewport: () => viewport.current,
    showSafeRing: debug,
    seed: Number.isFinite(seedParam) ? seedParam >>> 0 : null,
  });
  const debugPanel = createDebugPanel(document.body, debug, {
    onChange: (settings) => {
      play.applySettings(settings);
    },
    onRestart: (newSeed) => {
      play.restart(newSeed);
    },
  });
  debugPanel.setRenderer(app.renderer.name);
  play.attachDebugPanel(debugPanel);
  scenes.register(SCENE.play, play);

  onViewport = (vp) => {
    app.renderer.resize(vp.width, vp.height, vp.resolution);
    applyViewport(layers, vp);
    scenes.resize(vp);
    debugPanel.setViewport(vp);
  };
  onViewport(first);

  createGameLoop(LOOP, {
    update: (dt) => {
      scenes.update(dt);
    },
    render: (alpha) => {
      scenes.render(alpha);
      app.renderer.render(app.stage);
      debugPanel.frame(performance.now());
    },
  }).start();

  await scenes.go(SCENE.play);
}

boot().catch((error: unknown) => {
  console.error(error);
  const message = document.createElement('p');
  message.className = 'boot-error';
  message.textContent = STRINGS.bootError;
  document.body.appendChild(message);
});
