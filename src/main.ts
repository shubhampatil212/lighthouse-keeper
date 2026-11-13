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
import { settingsFromAddress } from './app/debugParams';
import { createFadeTransition } from './app/fade';
import { createGame } from './app/game';
import { createGameLoop } from './app/gameLoop';
import { islandBuildings, unlockAll } from './app/progress';
import { progressPreset } from './app/progressPresets';
import { createSceneManager } from './app/sceneManager';
import { screenJump } from './app/screenJump';
import { createStore } from './app/store';
import type { Viewport } from './app/viewport';
import { watchViewport } from './app/viewportWatcher';
import {
  AUTO_QUALITY,
  DEFAULT_SETTINGS,
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
import type { GameSettings } from './data/uiTypes';
import { createCodeArt } from './render/art/codeArt';
import { applyViewport, createLayers } from './render/layers';
import { PALETTE } from './render/palette';
import { createAutoQuality, type AutoQuality } from './render/quality';
import { createBackdrop } from './scenes/backdrop';
import { SCENE } from './scenes/context';
import { createPlayScene, type PlayPrefs } from './scenes/play';
import { createSandboxScene } from './scenes/sandbox';
import { createBootScreen } from './ui/bootScreen';
import { createDebugCampaign } from './ui/debugCampaign';
import { createDebugPanel, DEFAULT_DEBUG_SETTINGS, type DebugSettings } from './ui/debugPanel';
import { createFpsMeter } from './ui/fpsMeter';
import { STRINGS } from './ui/strings';

function requireElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
}

async function boot(): Promise<void> {
  const host = requireElement('stage');
  const fade = requireElement('fade');
  const uiRoot = requireElement('ui');
  // On the page itself (not in #ui) so it shows above the fade while loading.
  const bootScreen = createBootScreen(document.body);
  bootScreen.setProgress(0.15);

  const params = new URLSearchParams(location.search);
  const debug = params.has('debug');
  const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
  const addressDebug = settingsFromAddress(params, DEFAULT_DEBUG_SETTINGS);

  // Player settings start from the defaults, the device's reduced-motion choice and any debug address options.
  const settings = createStore<GameSettings>({
    ...DEFAULT_SETTINGS,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    quality: addressDebug.quality,
    colorblind: addressDebug.colorblind,
  });
  const progress = createStore(progressPreset(params.get('progress')));
  let debugSettings: DebugSettings = addressDebug;
  const withGame = (d: DebugSettings, s: GameSettings): DebugSettings => ({
    ...d,
    difficulty: s.difficulty,
    style: s.beamControl,
    quality: s.quality,
    colorblind: s.colorblind,
  });
  const prefsOf = (s: GameSettings): PlayPrefs => ({
    leftHanded: s.leftHanded,
    reducedMotion: s.reducedMotion,
    screenShake: s.screenShake,
    tutorialPrompts: s.tutorialPrompts,
    buildings: islandBuildings(progress.get()),
  });

  // Graphics quality: a fixed level, or Auto (starts at Medium and steps down if frames are slow).
  let qualityChoice: QualityChoice = settings.get().quality;
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
  bootScreen.setProgress(0.7);
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
  const backdrop = createBackdrop({
    pixi: app.renderer,
    layers,
    art,
    quality: QUALITY[qualityLevel],
  });
  const game = createGame({
    scenes,
    backdrop,
    uiRoot,
    settings,
    progress,
    version,
    boot: bootScreen,
  });

  // ?level=1-2 or a debug demo such as ?level=demo-cove (see src/data/levels/demos.ts) plays at once.
  const levelParam = params.get('level') ?? '';
  const demo = DEMO_LEVELS[levelParam];
  const directLevel = LEVELS[levelParam] ?? demo ?? (params.has('seed') ? LEVEL_1_2 : null);
  // The sandbox is a debug tool: dev builds, or ?debug in a production build.
  const sandbox = location.hash === '#sandbox' && (import.meta.env.DEV || debug);
  const sceneOptions = {
    layers,
    pixi: app.renderer,
    art,
    canvas: app.canvas,
    uiRoot,
    viewport: () => viewport.current,
    showSafeRing: debug,
    seed: Number.isFinite(seedParam) ? seedParam >>> 0 : null,
    settings: withGame(debugSettings, settings.get()),
    quality: QUALITY[qualityLevel],
    prefs: prefsOf(settings.get()),
    backdrop,
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
    backdrop.setQuality(QUALITY[level]);
    showQuality();
  };

  const debugPanel = createDebugPanel(document.body, debug, {
    onChange: (next) => {
      debugSettings = next;
      // The panel's difficulty, control style, quality and colorblind switches are player settings too.
      settings.update((s) => ({
        ...s,
        difficulty: next.difficulty,
        beamControl: next.style,
        quality: next.quality,
        colorblind: next.colorblind,
      }));
      play.applySettings(withGame(next, settings.get()));
    },
    onRestart: (newSeed) => {
      play.restart(newSeed);
    },
  });
  debugPanel.addSection(
    createDebugCampaign({
      unlockAll: () => {
        progress.update((p) => unlockAll(p, settings.get().difficulty));
      },
      jump: (levelId) => {
        game.ctx.startNight(levelId);
      },
    }),
  );
  debugPanel.setRenderer(app.renderer.name);
  play.attachDebugPanel(debugPanel);
  showQuality();

  // Settings apply the moment they change (docs/SCREENS.md).
  const applySettings = (s: GameSettings): void => {
    const root = document.documentElement.classList;
    root.toggle('reduce-motion', s.reducedMotion);
    root.toggle('large-text', s.largerText);
    fps.show(s.showFps);
    backdrop.setReducedMotion(s.reducedMotion);
    if (s.quality !== qualityChoice) {
      qualityChoice = s.quality;
      applyQuality(startLevel(qualityChoice));
    }
    const merged = withGame(debugSettings, s);
    play.applySettings(merged);
    play.applyPrefs(prefsOf(s));
    debugPanel.setSettings(merged);
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
      fps.frame(now);
      if (auto && !auto.settled && lastFrame !== null) {
        const dropped = auto.sample(now - lastFrame);
        // While measuring, keep the panel's "auto → level" text current (it says when Auto settles).
        if (dropped) applyQuality(dropped);
        else showQuality();
      }
      lastFrame = now;
    },
  }).start();

  // First screen: the sandbox, a night straight away (?level / ?seed), one screen (?screen=), or boot.
  const title = { name: SCENE.title, params: {} };
  const jump = screenJump(params);
  if (sandbox) {
    bootScreen.remove();
    await scenes.go(SCENE.sandbox);
  } else if (directLevel) {
    bootScreen.remove();
    if (!progress.get().started) progress.update((p) => ({ ...p, started: true }));
    await game.ctx.nav.reset(
      SCENE.play,
      { level: directLevel, upgrades: demo ? DEMO_UPGRADES : undefined },
      [title],
    );
  } else if (jump) {
    bootScreen.remove();
    await game.ctx.nav.reset(jump.name, jump.params, jump.under);
  } else {
    await scenes.go(SCENE.boot);
  }
}

boot().catch((error: unknown) => {
  console.error(error);
  const message = document.createElement('p');
  message.className = 'boot-error';
  message.textContent = STRINGS.bootError;
  document.body.appendChild(message);
});
