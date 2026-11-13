/**
 * The game's sound: AudioEngine, synth voices, ambience and the music director, all Web Audio,
 * no files. Screens tell it which scene is showing; the play scene hands it simulation events.
 * It never reads simulation internals. Nothing sounds until the first tap or key press.
 */
import type { SceneParams } from '../app/sceneManager';
import type { UiEvent } from '../app/uiEvents';
import type { SfxId } from '../data/soundTypes';
import type { QualityLevel, RegionId } from '../data/types';
import type { GameSettings } from '../data/uiTypes';
import type { LevelResult, SimEvent } from '../sim/events';
import { createAmbience, type Ambience, type AmbienceLook } from './ambience';
import { createAudioEngine, type AudioEngine } from './engine';
import { createMusicDirector, type MusicDirector, type MusicMode } from './music/director';
import { createNightListener } from './router';
import { playSfx } from './sfx/catalog';
import { createWhir, type Whir } from './sfx/world';

export type { AudioEngine } from './engine';
export type { MusicMode } from './music/director';

/** What the play scene needs from audio. */
export interface NightSound {
  onSimEvent(event: SimEvent): void;
  /** A night begins or restarts, in this region with this much rain (0–1). */
  nightStarted(region: RegionId, rain: number): void;
  setPaused(on: boolean): void;
  /** How fast the steered beam is turning (rad/s), for its whir. */
  setBeamTurn(speed: number): void;
}

export interface GameAudio extends NightSound {
  readonly engine: AudioEngine;
  onUiEvent(event: UiEvent): void;
  onScene(name: string, params: SceneParams): void;
  setVolumes(settings: GameSettings): void;
  setQuality(level: QualityLevel): void;
  /** Sound test page. */
  play(id: SfxId, n?: number): void;
  setMusic(mode: MusicMode): void;
  setTension(on: boolean): void;
  setAmbience(look: AmbienceLook): void;
  readonly music: MusicDirector | null;
}

const TICK_MS = 100;
/** Menu clicks right after a back or buy sound would double up, so they're skipped. */
const UI_OVERLAP_MS = 120;
const MENU_SEA: AmbienceLook = { region: 'harborBay', rain: 0, menu: true };
const NIGHT_SCENES = new Set(['play', 'sandbox']);
const SILENT_SCENES = new Set(['boot']);

export function createGameAudio(): GameAudio {
  const engine = createAudioEngine();
  let music: MusicDirector | null = null;
  let ambience: Ambience | null = null;
  let whir: Whir | null = null;
  let wantMode: MusicMode = 'silent';
  let wantSea: AmbienceLook = MENU_SEA;
  let quality: QualityLevel = 'medium';
  let lastUiSound = -Infinity;
  const night = createNightListener((id, pan) => {
    playSfx(engine, id, pan);
  });

  engine.whenReady((ctx, buses) => {
    music = createMusicDirector(ctx, buses);
    ambience = createAmbience(ctx, buses);
    whir = createWhir(ctx, buses.sfx);
    music.setMode(wantMode);
    ambience.set(wantSea);
    window.setInterval(() => {
      if (ctx.state !== 'running') return;
      music?.tick();
      ambience?.tick();
    }, TICK_MS);
  });

  const setMode = (mode: MusicMode): void => {
    wantMode = mode;
    music?.setMode(mode);
  };
  const setSea = (look: AmbienceLook): void => {
    wantSea = look;
    ambience?.set(look);
  };
  const uiSound = (id: SfxId, n = 1): void => {
    lastUiSound = performance.now();
    playSfx(engine, id, 0, n);
  };

  return {
    engine,
    get music() {
      return music;
    },
    onSimEvent(event) {
      night.onEvent(event);
      music?.setTension(night.tense);
    },
    nightStarted(region, rain) {
      night.reset();
      setMode('night');
      music?.setTension(false);
      setSea({ region, rain, menu: false });
    },
    setPaused(on) {
      music?.setPaused(on);
      if (on) whir?.set(0);
    },
    setBeamTurn(speed) {
      whir?.set(quality === 'high' ? speed : 0);
    },
    onUiEvent(event) {
      switch (event.type) {
        case 'tap':
          if (performance.now() - lastUiSound > UI_OVERLAP_MS) uiSound('uiTap');
          break;
        case 'back':
          uiSound('uiBack');
          break;
        case 'buy':
          uiSound('uiBuy');
          break;
        case 'star':
          uiSound('star', event.n);
          break;
      }
    },
    onScene(name, params) {
      if (NIGHT_SCENES.has(name)) return;
      whir?.set(0);
      setSea(MENU_SEA);
      if (SILENT_SCENES.has(name)) setMode('silent');
      else if (name === 'results') {
        const result = params.result as LevelResult | undefined;
        setMode(result?.outcome === 'won' ? 'dawn' : 'fail');
      } else if (name === 'endlessResults') setMode('dawn');
      // Every other screen keeps the title theme going (it doesn't restart between menus).
      else setMode('title');
    },
    setVolumes(settings) {
      engine.setVolumes(settings);
    },
    setQuality(level) {
      quality = level;
      if (level !== 'high') whir?.set(0);
    },
    play(id, n = 1) {
      playSfx(engine, id, 0, n);
    },
    setMusic: setMode,
    setTension(on) {
      music?.setTension(on);
    },
    setAmbience: setSea,
  };
}
