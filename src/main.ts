/** Boot: create the Pixi renderer, viewport, game loop and scene manager, then open the first scene. */
import { Application } from 'pixi.js';
import './ui/tokens.css';
import './ui/base.css';
import { settingsFromAddress } from './app/debugParams';
import { createFadeTransition } from './app/fade';
import { createGameLoop } from './app/gameLoop';
import { createSceneManager } from './app/sceneManager';
import type { Viewport } from './app/viewport';
import { watchViewport } from './app/viewportWatcher';
import {
  AUTO_QUALITY,
  DEMO_LEVELS,
  DEMO_UPGRADES,
  LEVEL_1_2,
  LEVELS,
  LOOP,
  QUALITY,
  SCENE_TRANSITION,
  VIEWPORT,
} from './data';
import type { QualityChoice, QualityLevel } from './data/types';
import { createCodeArt } from './render/art/codeArt';
import { applyViewport, createLayers } from './render/layers';
import { createAutoQuality, type AutoQuality } from './render/quality';
import { PALETTE } from './render/palette';
import { SCENE } from './scenes';
import { createPlayScene } from './scenes/play';
import { createSandboxScene } from './scenes/sandbox';
import { createDebugPanel, DEFAULT_DEBUG_SETTINGS } from './ui/debugPanel';
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
  const settings = settingsFromAddress(params, DEFAULT_DEBUG_SETTINGS);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Graphics quality: a fixed level, or Auto (starts at Medium and steps down if frames are slow).
  let qualityChoice: QualityChoice = settings.quality;
  let auto: AutoQuality | null = null;
  const startLevel = (choice: QualityChoice): QualityLevel => {
    auto = choice === 'auto' ? createAutoQuality(AUTO_QUALITY) : null;
    return auto ? auto.level : (choice as QualityLevel);
  };
  let qualityLevel = startLevel(qualityChoice);

  const app = new Application();
  let onViewport: (vp: Viewport) => void = () => undefined;
  const viewport = watchViewport(VIEWPORT, QUALITY[qualityLevel].maxPixelRatio, (vp) => {
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
    // Pixi picks (WebGL today). ?renderer=webgpu asks for WebGPU, for testing the WebGPU shaders.
    ...(params.get('renderer') === 'webgpu' ? { preference: 'webgpu' as const } : {}),
  });
  app.ticker.stop();
  app.canvas.setAttribute('aria-label', STRINGS.canvasLabel);
  app.canvas.setAttribute('role', 'img');
  host.appendChild(app.canvas);

  const layers = createLayers(app.stage);
  const art = createCodeArt();
  const scenes = createSceneManager(
    createFadeTransition(fade, SCENE_TRANSITION.fadeMs),
    () => viewport.current,
  );
  // ?level=1-2 or a debug demo such as ?level=demo-cove (see src/data/levels/demos.ts).
  const levelParam = params.get('level') ?? '';
  const demo = DEMO_LEVELS[levelParam];
  const level = LEVELS[levelParam] ?? demo ?? LEVEL_1_2;
  // The sandbox is a debug tool: dev builds, or ?debug in a production build.
  const sandbox = location.hash === '#sandbox' && (import.meta.env.DEV || debug);
  const sceneOptions = {
    layers,
    pixi: app.renderer,
    art,
    canvas: app.canvas,
    uiRoot: document.body,
    viewport: () => viewport.current,
    showSafeRing: debug,
    seed: Number.isFinite(seedParam) ? seedParam >>> 0 : null,
    settings,
    quality: QUALITY[qualityLevel],
    buildings: [],
    reducedMotion,
  };
  const play = sandbox
    ? createSandboxScene(sceneOptions)
    : createPlayScene({ ...sceneOptions, level, ...(demo ? { upgrades: DEMO_UPGRADES } : {}) });
  // Switching to or from #sandbox in the address bar reloads into the other scene.
  window.addEventListener('hashchange', () => {
    location.reload();
  });

  const showQuality = (): void => {
    const status = auto
      ? `auto → ${qualityLevel}${auto.settled ? '' : ' (measuring)'}`
      : qualityLevel;
    debugPanel.setQualityStatus(status);
  };
  const applyQuality = (level: QualityLevel): void => {
    qualityLevel = level;
    viewport.setMaxPixelRatio(QUALITY[level].maxPixelRatio);
    play.setQuality(QUALITY[level]);
    showQuality();
  };

  const debugPanel = createDebugPanel(document.body, debug, {
    onChange: (next) => {
      if (next.quality !== qualityChoice) {
        qualityChoice = next.quality;
        applyQuality(startLevel(qualityChoice));
      }
      play.applySettings(next);
    },
    onRestart: (newSeed) => {
      play.restart(newSeed);
    },
  });
  debugPanel.setRenderer(app.renderer.name);
  play.attachDebugPanel(debugPanel);
  showQuality();
  const sceneName = sandbox ? SCENE.sandbox : SCENE.play;
  scenes.register(sceneName, play);

  onViewport = (vp) => {
    app.renderer.resize(vp.width, vp.height, vp.resolution);
    applyViewport(layers, vp);
    scenes.resize(vp);
    debugPanel.setViewport(vp);
  };
  onViewport(first);

  let lastFrame: number | null = null;
  createGameLoop(LOOP, {
    update: (dt) => {
      scenes.update(dt);
    },
    render: (alpha) => {
      scenes.render(alpha);
      app.renderer.render(app.stage);
      const now = performance.now();
      debugPanel.frame(now);
      if (auto && !auto.settled && lastFrame !== null) {
        const dropped = auto.sample(now - lastFrame);
        // While measuring, keep the panel's "auto → level" text current (it says when Auto settles).
        if (dropped) applyQuality(dropped);
        else showQuality();
      }
      lastFrame = now;
    },
  }).start();

  await scenes.go(sceneName);
}

boot().catch((error: unknown) => {
  console.error(error);
  const message = document.createElement('p');
  message.className = 'boot-error';
  message.textContent = STRINGS.bootError;
  document.body.appendChild(message);
});
