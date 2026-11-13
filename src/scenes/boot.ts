/**
 * The first scene: the live sea comes up behind the loading screen, which waits for a tap
 * (the browser's rule for starting sound) and then opens the title.
 */
import type { Scene } from '../app/sceneManager';
import type { BootScreen } from '../ui/bootScreen';
import { SCENE, type GameContext } from './context';
import { menuScene } from './menuScene';

export function createBootScene(ctx: GameContext, boot: BootScreen): Scene {
  const scene = menuScene(ctx, () => ({ root: document.createElement('div') }));
  return {
    ...scene,
    enter(params) {
      scene.enter(params);
      boot.setProgress(1);
      void boot.waitForTap().then(() => ctx.nav.reset(SCENE.title));
    },
    exit() {
      boot.remove();
      scene.exit();
    },
    // Nothing to go back to from the loading screen.
    back: () => true,
  };
}
