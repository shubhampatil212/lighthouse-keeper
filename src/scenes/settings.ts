/** Settings screen (from the title). From Pause, the same panel opens over the frozen night. */
import type { Scene } from '../app/sceneManager';
import { screenHeader } from '../ui/header';
import { h } from '../ui/kit/dom';
import { createSettingsPanel } from '../ui/settingsPanel';
import { STRINGS } from '../ui/strings';
import type { GameContext } from './context';
import { menuScene } from './menuScene';

export function createSettingsScene(ctx: GameContext): Scene {
  return menuScene(ctx, () => {
    const panel = createSettingsPanel(ctx.settings, {
      data: ctx.data,
      toast: (text) => {
        ctx.toast(text);
      },
      parent: ctx.uiRoot,
    });
    const root = h(
      'main',
      { className: 'menu-screen menu-screen--top' },
      screenHeader(STRINGS.settingsTitle, () => {
        ctx.nav.back();
      }),
      h('div', { className: 'menu-column menu-column--scroll' }, panel),
    );
    return { root };
  });
}
