/**
 * Developer panel: frame rate, graphics quality, tick count, ships, seed and viewport, plus switches
 * for "reveal all", the control style, the difficulty, restarting, and the look (region tint, weather,
 * quality, island buildings, ship parade). Toggle with the ` key; ?debug opens it at start.
 * It's a developer tool, so its labels aren't in strings.ts and it reads the world directly.
 */
import './debugPanel.css';
import type { Viewport } from '../app/viewport';
import { REGION_IDS, type WeatherPresetId } from '../data/regions';
import type { ControlStyle, DifficultyId, QualityChoice, RegionId } from '../data/types';
import type { World } from '../sim/world';
import { checkbox, radioGroup, select } from './debugControls';

export interface DebugSettings {
  revealAll: boolean;
  style: ControlStyle;
  difficulty: DifficultyId;
  /** 'level' = the level's own region. */
  region: RegionId | 'level';
  /** 'level' = the level's (or region's) own weather. */
  weather: WeatherPresetId | 'level';
  quality: QualityChoice;
  /** Show every island building, as if the campaign were finished. */
  allBuildings: boolean;
  /** All six ship types side by side, lit. */
  parade: boolean;
  /** Colorblind harbor colors and shapes (the same switch as the Accessibility setting). */
  colorblind: boolean;
}

export const DEFAULT_DEBUG_SETTINGS: DebugSettings = {
  revealAll: false,
  style: 'follow',
  difficulty: 'keeper',
  region: 'level',
  weather: 'level',
  quality: 'auto',
  allBuildings: false,
  parade: false,
  colorblind: false,
};

export interface DebugPanelHandlers {
  onChange(settings: DebugSettings): void;
  onRestart(newSeed: boolean): void;
}

export interface DebugPanel {
  frame(now: number): void;
  setRenderer(name: string): void;
  setViewport(vp: Viewport): void;
  showWorld(world: World, paused: boolean): void;
  setSettings(settings: DebugSettings): void;
  /** For example "auto → medium". */
  setQualityStatus(text: string): void;
  /** Adds a section (for example the campaign controls) at the bottom. */
  addSection(section: HTMLElement): void;
  readonly open: boolean;
}

const REPAINT_MS = 250;
const DIFFICULTY_IDS: readonly DifficultyId[] = ['calm', 'keeper', 'storm'];
const STYLES: readonly [ControlStyle, string][] = [
  ['follow', 'Follow finger'],
  ['drag', 'Drag to rotate'],
];
const QUALITIES: readonly (readonly [QualityChoice, string])[] = [
  ['auto', 'Auto'],
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
];
const WEATHERS: readonly (readonly [WeatherPresetId | 'level', string])[] = [
  ['level', 'Level'],
  ['clear', 'Clear'],
  ['fog', 'Fog'],
  ['rain', 'Rain'],
  ['snow', 'Snow'],
];

export function createDebugPanel(
  parent: HTMLElement,
  startOpen: boolean,
  handlers: DebugPanelHandlers,
): DebugPanel {
  const root = document.createElement('section');
  root.className = 'debug-panel';
  root.hidden = !startOpen;
  root.setAttribute('aria-label', 'Debug panel');
  const readout = document.createElement('pre');

  let settings: DebugSettings = DEFAULT_DEBUG_SETTINGS;
  const change = (next: Partial<DebugSettings>): void => {
    settings = { ...settings, ...next };
    handlers.onChange(settings);
  };

  const reveal = checkbox('Reveal all', (on) => {
    change({ revealAll: on });
  });
  const buildings = checkbox('All buildings', (on) => {
    change({ allBuildings: on });
  });
  const parade = checkbox('Ship parade', (on) => {
    change({ parade: on });
  });
  const colorblind = checkbox('Colorblind', (on) => {
    change({ colorblind: on });
  });
  const view = document.createElement('fieldset');
  view.append(reveal.element, buildings.element, parade.element, colorblind.element);

  const region = select(
    'Region ',
    [['level', 'Level'] as const, ...REGION_IDS.map((id) => [id, id] as const)],
    (value) => {
      change({ region: value });
    },
  );
  const weather = select('Weather ', WEATHERS, (value) => {
    change({ weather: value });
  });
  const quality = select('Quality ', QUALITIES, (value) => {
    change({ quality: value });
  });
  const look = document.createElement('fieldset');
  look.append(region.element, weather.element, quality.element);

  const style = radioGroup('Controls', 'debug-style', STYLES, (value) => {
    change({ style: value });
  });
  const difficulty = radioGroup(
    'Difficulty (restarts)',
    'debug-difficulty',
    DIFFICULTY_IDS.map((id) => [id, id] as const),
    (value) => {
      change({ difficulty: value });
    },
  );

  const restart = document.createElement('fieldset');
  for (const [text, newSeed] of [
    ['Restart same seed', false],
    ['New seed', true],
  ] as const) {
    const button = Object.assign(document.createElement('button'), {
      type: 'button',
      textContent: text,
    });
    button.addEventListener('click', () => {
      handlers.onRestart(newSeed);
    });
    restart.append(button);
  }

  // Phones have no ` key: a button hides the panel, leaving a small tab to bring it back.
  const hide = Object.assign(document.createElement('button'), {
    type: 'button',
    textContent: 'Hide panel',
  });
  const opener = Object.assign(document.createElement('button'), {
    type: 'button',
    className: 'debug-opener',
    textContent: 'Debug',
  });
  opener.hidden = true;
  let isOpen = startOpen;
  const show = (open: boolean): void => {
    isOpen = open;
    root.hidden = !open;
    opener.hidden = open;
  };
  hide.addEventListener('click', () => {
    show(false);
  });
  opener.addEventListener('click', () => {
    show(true);
  });
  restart.append(hide);

  root.append(readout, view, look, style.element, difficulty.element, restart);
  parent.append(root, opener);

  window.addEventListener('keydown', (event) => {
    if (event.key === '`') show(!isOpen);
  });

  let renderer = '';
  let qualityText = '';
  let viewportText = '';
  let worldText = '';
  let frames = 0;
  let since = 0;
  let fps = 0;
  let lastPaint = 0;

  const paint = (): void => {
    readout.textContent = `${renderer}  ${fps} fps  quality ${qualityText}\n${worldText}\n${viewportText}`;
  };

  return {
    frame(now) {
      frames++;
      if (now - since >= 1000) {
        fps = Math.round((frames * 1000) / (now - since));
        frames = 0;
        since = now;
      }
      if (isOpen && now - lastPaint >= REPAINT_MS) {
        lastPaint = now;
        paint();
      }
    },
    setRenderer(name) {
      renderer = name;
    },
    setViewport(vp) {
      const i = vp.insets;
      viewportText =
        `${vp.width}×${vp.height} css px @${vp.resolution}x  S=${vp.scale.toFixed(3)}\n` +
        `safe insets ${i.top} ${i.right} ${i.bottom} ${i.left}`;
    },
    showWorld(world, paused) {
      const { state, setup } = world;
      const status = paused ? 'paused' : state.status;
      worldText =
        `level ${setup.level.id} · ${setup.difficultyId} · seed ${state.seed}\n` +
        `tick ${state.tick} · ${state.time.toFixed(1)} s · ${status}\n` +
        `ships: ${state.ships.length} at sea · ${state.spawnIndex}/${setup.spawns.length} spawned\n` +
        `saved ${state.saved} · wrecked ${state.wrecked}/${setup.difficulty.wreckAllowance} · coins ${state.coins}\n` +
        `caught ${state.caught} · escaped ${state.escaped} · pirates ${state.pirates.length} · ` +
        `horn ${state.abilities.foghornCooldown.toFixed(1)} s · flares ${state.abilities.flares}`;
    },
    setSettings(next) {
      settings = next;
      reveal.set(next.revealAll);
      buildings.set(next.allBuildings);
      parade.set(next.parade);
      colorblind.set(next.colorblind);
      region.set(next.region);
      weather.set(next.weather);
      quality.set(next.quality);
      style.set(next.style);
      difficulty.set(next.difficulty);
    },
    setQualityStatus(text) {
      qualityText = text;
    },
    addSection(section) {
      root.append(section);
    },
    get open() {
      return isOpen;
    },
  };
}
