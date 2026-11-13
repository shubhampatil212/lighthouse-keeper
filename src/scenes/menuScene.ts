/**
 * Turns a DOM screen into a Scene: builds it on enter, removes it on exit, and keeps the live sea
 * (or nothing, for opaque screens like the sea chart) drawing behind it.
 */
import type { Scene, SceneParams } from '../app/sceneManager';
import { focusQuietly } from '../ui/inputModality';
import { focusables } from '../ui/kit/dom';
import type { GameContext } from './context';

export interface ScreenView {
  root: HTMLElement;
  /** Handle back inside the screen (close a picker); true = handled. */
  back?(): boolean;
  dispose?(): void;
}

export interface MenuSceneOptions {
  /** False for screens that cover the whole sea (the chart): the backdrop stops drawing. */
  backdrop?: boolean;
}

export function menuScene(
  ctx: GameContext,
  build: (params: SceneParams) => ScreenView,
  options: MenuSceneOptions = {},
): Scene {
  let view: ScreenView | null = null;
  let lastFrame: number | null = null;
  return {
    enter(params) {
      if (options.backdrop === false) ctx.backdrop.hide();
      else ctx.backdrop.show();
      view = build(params);
      view.root.classList.add('screen');
      ctx.uiRoot.append(view.root);
      // Focus the screen's first control so keyboard players can start at once (no ring after a tap).
      const first =
        view.root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(view.root)[0];
      if (first) focusQuietly(first);
    },
    exit() {
      view?.dispose?.();
      view?.root.remove();
      view = null;
      lastFrame = null;
    },
    update(dt) {
      ctx.backdrop.update(dt);
    },
    render() {
      const now = performance.now();
      const frame = lastFrame === null ? 0 : Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;
      ctx.backdrop.render(frame);
    },
    resize(vp) {
      ctx.backdrop.resize(vp);
    },
    back() {
      return view?.back?.() ?? false;
    },
  };
}
