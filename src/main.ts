/**
 * Boot: show the loading screen, create the Pixi renderer, viewport, game loop and screens,
 * connect settings and progress to everything that uses them, then open the first screen.
 */
import { Application } from 'pixi.js';
import { version } from '../package.json';
import './ui/tokens.css';
import './ui/base.css';
import './ui/kit/kit.css';
import './ui/screens.css';
import './ui/hud.css';
import { wireAudio } from './app/audioWiring';
import { watchForCrashes } from './app/crashScreen';
import { settingsFromAddress } from './app/debugParams';
import { withGame, wireDebug } from './app/debugWiring';
import { createFadeTransition } from './app/fade';
import { openFirstScreen } from './app/firstScreen';
import { loadFonts } from './app/fonts';
import { createGame } from './app/game';
import { createGameLoop } from './app/gameLoop';
import { guardMobileGestures } from './app/mobileGuards';
import { islandBuildings } from './app/progress';
import { registerServiceWorker } from './app/pwa';
import { createQualityControl } from './app/qualityControl';
import { loadGame } from './app/saveWiring';
import { createSceneManager } from './app/sceneManager';
import type { Viewport } from './app/viewport';
import { watchViewport } from './app/viewportWatcher';
import { DEMO_LEVELS, LEVEL_1_2, LEVELS, LOOP, QUALITY, SCENE_TRANSITION, VIEWPORT } from './data';
import type { QualityLevel } from './data/types';
import type { GameSettings } from './data/uiTypes';
import { createCodeArt } from './render/art/codeArt';
import { applyViewport, createLayers } from './render/layers';
import { PALETTE } from './render/palette';
import { createBackdrop } from './scenes/backdrop';
import { SCENE } from './scenes/context';
import { createPlayScene, type PlayPrefs } from './scenes/play';
import { createSandboxScene } from './scenes/sandbox';
import { createBootScreen } from './ui/bootScreen';
import { DEFAULT_DEBUG_SETTINGS } from './ui/debugPanel';
import { createFpsMeter } from './ui/fpsMeter';
import { STRINGS } from './ui/strings';

function requireElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
}

// First, so even a failed start shows the gentle "Something went wrong" card.
const crashes = watchForCrashes();

async function boot(): Promise<void> {
  const host = requireElement('stage');
  const fade = requireElement('fade');
  const uiRoot = requireElement('ui');
  // Already on the page (index.html draws it before any script loads); this takes it over.
  const bootScreen = createBootScreen(document.body);
  bootScreen.setProgress(0.15);
  registerServiceWorker();
  const fonts = loadFonts().then(() => {
    bootScreen.setProgress(0.45);
  });

  const params = new URLSearchParams(location.search);
  const debugOpen = params.has('debug');
  const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
  const addressDebug = settingsFromAddress(params, DEFAULT_DEBUG_SETTINGS);

  // Settings and progress come from the save; ?quality= and ?colorblind (debug) override them.
  const saved = loadGame(params, {
    quality: params.has('quality') ? addressDebug.quality : null,
    colorblind: addressDebug.colorblind,
  });
  const { settings, progress } = saved;
  crashes.setSaver(() => {
    saved.flush();
  });
  const prefsOf = (s: GameSettings): PlayPrefs => ({
    leftHanded: s.leftHanded,
    reducedMotion: s.reducedMotion,
    screenShake: s.screenShake,
    tutorialPrompts: s.tutorialPrompts,
    highContrastReefs: s.highContrastReefs,
    haptics: s.haptics,
    buildings: islandBuildings(progress.get()),
  });

  // Graphics quality: a fixed level, or Auto (starts at Medium and steps down if frames are slow).
  let applyQuality: (level: QualityLevel) => void = () => undefined;
  let showQuality: () => void = () => undefined;
  const quality = createQualityControl(
    settings.get().quality,
    (level) => {
      applyQuality(level);
    },
    () => {
      showQuality();
    },
  );

  const app = new Application();
  let onViewport: (vp: Viewport) => void = () => undefined;
  const viewport = watchViewport(
    VIEWPORT,
    QUALITY[quality.level].maxPixelRatio,
    (vp) => {
      onViewport(vp);
    },
    // While the phone turns, the sea hides behind a quick fade so no stretched frame shows.
    (settling) => {
      host.classList.toggle('is-rotating', settling);
    },
  );
  const first = viewport.current;
  guardMobileGestures(host);

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
  await fonts;
  bootScreen.setProgress(0.75);
  app.ticker.stop();
  app.canvas.setAttribute('aria-label', STRINGS.canvasLabel);
  app.canvas.setAttribute('role', 'img');
  host.appendChild(app.canvas);
  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', STRINGS.seaLandmark);

  const layers = createLayers(app.stage);
  const art = createCodeArt();
  const scenes = createSceneManager(
    createFadeTransition(fade, SCENE_TRANSITION.fadeMs),
    () => viewport.current,
  );
  const backdrop = createBackdrop({
    pixi: app.renderer,
    layers,
    art,
    quality: QUALITY[quality.level],
  });
  const game = createGame({
    scenes,
    backdrop,
    uiRoot,
    settings,
    progress,
    version,
    boot: bootScreen,
    data: saved.data,
  });
  const audio = wireAudio(scenes, settings, uiRoot);
  // An unreadable save: say so gently once the title is up.
  let notice = saved.notice;
  scenes.onEnter((name) => {
    if (!notice || name !== SCENE.title) return;
    game.ctx.toast(notice);
    notice = null;
  });
  audio.setQuality(quality.level);

  // ?level=1-2 or a debug demo such as ?level=demo-cove (see src/data/levels/demos.ts) plays at once.
  const levelParam = params.get('level') ?? '';
  const demo = DEMO_LEVELS[levelParam];
  const directLevel = LEVELS[levelParam] ?? demo ?? (params.has('seed') ? LEVEL_1_2 : null);
  // The sandbox is a debug tool: dev builds, or ?debug in a production build.
  const sandbox = location.hash === '#sandbox' && (import.meta.env.DEV || debugOpen);
  const sceneOptions = {
    layers,
    pixi: app.renderer,
    art,
    canvas: app.canvas,
    uiRoot,
    viewport: () => viewport.current,
    showSafeRing: debugOpen,
    seed: Number.isFinite(seedParam) ? seedParam >>> 0 : null,
    settings: withGame(addressDebug, settings.get()),
    quality: QUALITY[quality.level],
    prefs: prefsOf(settings.get()),
    backdrop,
    sound: audio,
  };
  const play = sandbox
    ? createSandboxScene(sceneOptions)
    : createPlayScene({ ...sceneOptions, level: directLevel ?? LEVEL_1_2, hooks: game.hooks });
  game.registerPlay(play, sandbox ? SCENE.sandbox : SCENE.play);
  // Switching to or from #sandbox in the address bar reloads into the other scene.
  window.addEventListener('hashchange', () => {
    location.reload();
  });

  const fps = createFpsMeter(uiRoot);
  const debug = wireDebug({
    open: debugOpen,
    initial: addressDebug,
    settings,
    progress,
    play,
    audio,
    rendererName: app.renderer.name,
    jump: (levelId) => {
      game.ctx.startNight(levelId);
    },
  });
  showQuality = () => {
    debug.panel.setQualityStatus(quality.status());
  };
  applyQuality = (level) => {
    viewport.setMaxPixelRatio(QUALITY[level].maxPixelRatio);
    play.setQuality(QUALITY[level]);
    backdrop.setQuality(QUALITY[level]);
    audio.setQuality(level);
    showQuality();
  };
  showQuality();

  // Settings apply the moment they change (docs/SCREENS.md).
  const applySettings = (s: GameSettings): void => {
    const root = document.documentElement.classList;
    root.toggle('reduce-motion', s.reducedMotion);
    root.toggle('large-text', s.largerText);
    fps.show(s.showFps);
    backdrop.setReducedMotion(s.reducedMotion);
    quality.choose(s.quality);
    const merged = withGame(debug.settings(), s);
    play.applySettings(merged);
    play.applyPrefs(prefsOf(s));
    debug.panel.setSettings(merged);
  };
  settings.subscribe(applySettings);
  applySettings(settings.get());
  const applyProgress = (): void => {
    backdrop.setBuildings(islandBuildings(progress.get()));
    play.applyPrefs(prefsOf(settings.get()));
  };
  progress.subscribe(applyProgress);
  applyProgress();

  onViewport = (vp) => {
    app.renderer.resize(vp.width, vp.height, vp.resolution);
    applyViewport(layers, vp);
    scenes.resize(vp);
    backdrop.resize(vp);
    debug.panel.setViewport(vp);
  };
  onViewport(first);

  let firstFrame = true;
  createGameLoop(LOOP, {
    update: (dt) => {
      scenes.update(dt);
    },
    render: (alpha) => {
      scenes.render(alpha);
      app.renderer.render(app.stage);
      const now = performance.now();
      debug.panel.frame(now);
      fps.frame(now);
      quality.frame(now);
      if (firstFrame) {
        firstFrame = false;
        bootScreen.setProgress(0.9);
      }
    },
  }).start();

  await openFirstScreen({
    params,
    sandbox,
    directLevel,
    demo: demo !== undefined,
    scenes,
    game,
    progress,
    bootScreen,
  });
}

boot().catch((error: unknown) => {
  crashes.show(error);
});
