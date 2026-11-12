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
import { createDebugOverlay } from './ui/debugOverlay';
import { STRINGS } from './ui/strings';

function requireElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
}

async function boot(): Promise<void> {
  const host = requireElement('stage');
  const fade = requireElement('fade');
  const debug = new URLSearchParams(location.search).has('debug');
  const debugOverlay = debug ? createDebugOverlay(document.body) : null;

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
  debugOverlay?.setRenderer(app.renderer.name);

  const layers = createLayers(app.stage);
  const scenes = createSceneManager(
    createFadeTransition(fade, SCENE_TRANSITION.fadeMs),
    () => viewport.current,
  );
  scenes.register(SCENE.play, createPlayScene({ layers, showSafeRing: debug }));

  onViewport = (vp) => {
    app.renderer.resize(vp.width, vp.height, vp.resolution);
    applyViewport(layers, vp);
    scenes.resize(vp);
    debugOverlay?.setViewport(vp);
  };
  onViewport(first);

  createGameLoop(LOOP, {
    update: (dt) => {
      scenes.update(dt);
    },
    render: (alpha) => {
      scenes.render(alpha);
      app.renderer.render(app.stage);
      debugOverlay?.frame(performance.now());
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
