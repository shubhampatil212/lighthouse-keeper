/** What every screen can reach: navigation, the menu backdrop, settings and progress. */
import type { Navigator } from '../app/navigator';
import type { Progress } from '../app/progress';
import type { Store } from '../app/store';
import type { GameSettings } from '../data/uiTypes';
import type { Backdrop } from './backdrop';

export interface GameContext {
  nav: Navigator;
  backdrop: Backdrop;
  /** Where screens put their DOM (above the canvas, below the fade). */
  uiRoot: HTMLElement;
  settings: Store<GameSettings>;
  progress: Store<Progress>;
  version: string;
  /** Start a night of a campaign level (or a debug level id). */
  startNight(levelId: string): void;
  /** A short notice at the bottom of the screen. */
  toast(text: string): void;
}

/** Screen names for the SceneManager. */
export const SCENE = {
  boot: 'boot',
  title: 'title',
  difficulty: 'difficulty',
  map: 'map',
  levelSelect: 'levelSelect',
  briefing: 'briefing',
  play: 'play',
  results: 'results',
  endlessResults: 'endlessResults',
  shop: 'shop',
  logbook: 'logbook',
  settings: 'settings',
  credits: 'credits',
  /** Debug only: #sandbox. */
  sandbox: 'sandbox',
} as const;

export type SceneName = (typeof SCENE)[keyof typeof SCENE];
