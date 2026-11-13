/** The play scene's options, hooks and public shape (see play.ts). */
import type { Renderer as PixiRenderer } from 'pixi.js';
import type { Scene } from '../app/sceneManager';
import type { Viewport } from '../app/viewport';
import type { IslandBuildingId, LevelDef, QualityProfile, Upgrades } from '../data/types';
import type { ActionIntent } from '../input/controller';
import type { ArtProvider } from '../render/art/types';
import type { Layers } from '../render/layers';
import type { LevelResult } from '../sim/events';
import type { World } from '../sim/world';
import type { DebugPanel, DebugSettings } from '../ui/debugPanel';
import type { Backdrop } from './backdrop';
import type { NightReport } from './nightLog';

export interface PlayHooks {
  /** The night is over and its last moments have played out. */
  onNightEnd(level: LevelDef, result: LevelResult, report: NightReport): void;
  /** "Quit to map" from Pause. */
  onQuit(): void;
  /** The settings panel shown from Pause. */
  settingsPanel(): HTMLElement;
}

/** Player settings the play screen uses directly. */
export interface PlayPrefs {
  leftHanded: boolean;
  reducedMotion: boolean;
  screenShake: boolean;
  tutorialPrompts: boolean;
  buildings: readonly IslandBuildingId[];
}

export interface PlaySceneOptions {
  /** The night to play until enter() is given another. */
  level: LevelDef;
  upgrades?: Upgrades;
  /** The night never ends on its own (the sandbox). */
  endless?: boolean;
  layers: Layers;
  pixi: PixiRenderer;
  art: ArtProvider;
  canvas: HTMLCanvasElement;
  uiRoot: HTMLElement;
  viewport: () => Viewport;
  showSafeRing: boolean;
  /** Seed for the first night (from ?seed=), or null for a random one. */
  seed: number | null;
  settings: DebugSettings;
  quality: QualityProfile;
  prefs: PlayPrefs;
  /** The menu sea, hidden while a night is on (both draw into the same layers). */
  backdrop?: Backdrop;
  hooks?: PlayHooks;
}

export interface PlayScene extends Scene {
  readonly settings: DebugSettings;
  applySettings(settings: DebugSettings): void;
  applyPrefs(prefs: PlayPrefs): void;
  setQuality(profile: QualityProfile): void;
  /** Starts the night again, with the same seed or a new one. */
  restart(newSeed: boolean): void;
  readonly world: World;
  /** Plays a different level or upgrades from the start (the sandbox). */
  load(level: LevelDef, upgrades: Upgrades): void;
  /** Simulation steps per real step: 0.25 = slow motion, 4 = fast forward (the sandbox). */
  timeScale: number;
  press(action: ActionIntent): void;
  attachDebugPanel(panel: DebugPanel): void;
}
