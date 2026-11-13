/**
 * Which screen opens first: the sandbox (#sandbox), a night straight away (?level= or ?seed=), one
 * chosen screen (?screen=), or the loading screen, which waits for a tap and then opens the title.
 */
import { DEMO_UPGRADES } from '../data';
import type { LevelDef } from '../data/types';
import { SCENE } from '../scenes/context';
import type { BootScreen } from '../ui/bootScreen';
import type { Game } from './game';
import type { Progress } from './progress';
import type { SceneManager } from './sceneManager';
import { screenJump } from './screenJump';
import type { Store } from './store';

export async function openFirstScreen(options: {
  params: URLSearchParams;
  sandbox: boolean;
  /** The night to play at once, if the address asks for one. */
  directLevel: LevelDef | null;
  /** True for a debug demo night (it gets the demo upgrades). */
  demo: boolean;
  scenes: SceneManager;
  game: Game;
  progress: Store<Progress>;
  bootScreen: BootScreen;
}): Promise<void> {
  const { scenes, game, progress, bootScreen, directLevel } = options;
  const title = { name: SCENE.title, params: {} };
  const jump = screenJump(options.params);
  if (options.sandbox) {
    bootScreen.remove();
    await scenes.go(SCENE.sandbox);
  } else if (directLevel) {
    bootScreen.remove();
    if (!progress.get().started) progress.update((p) => ({ ...p, started: true }));
    await game.ctx.nav.reset(
      SCENE.play,
      { level: directLevel, upgrades: options.demo ? DEMO_UPGRADES : undefined },
      [title],
    );
  } else if (jump) {
    bootScreen.remove();
    await game.ctx.nav.reset(jump.name, jump.params, jump.under);
  } else {
    await scenes.go(SCENE.boot);
  }
}
