/**
 * Browser side of the viewport: reads window size, pixel ratio and safe-area insets,
 * and reports a new Viewport whenever they change.
 */
import type { ViewportConfig } from '../data/types';
import { computeViewport, type Insets, type Viewport } from './viewport';

function createInsetProbe(): HTMLElement {
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:fixed;inset:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) ' +
    'env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);';
  document.body.appendChild(probe);
  return probe;
}

function readInsets(probe: HTMLElement): Insets {
  const style = getComputedStyle(probe);
  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

export interface ViewportWatcher {
  readonly current: Viewport;
  setMaxPixelRatio(value: number): void;
  dispose(): void;
}

export function watchViewport(
  config: ViewportConfig,
  maxPixelRatio: number,
  onChange: (vp: Viewport) => void,
): ViewportWatcher {
  const probe = createInsetProbe();
  let cap = maxPixelRatio;
  let pending = 0;

  const measure = (): Viewport =>
    computeViewport(
      {
        width: window.innerWidth,
        height: window.innerHeight,
        insets: readInsets(probe),
        devicePixelRatio: window.devicePixelRatio,
        maxPixelRatio: cap,
      },
      config,
    );

  let current = measure();

  const update = (): void => {
    pending = 0;
    current = measure();
    onChange(current);
  };
  const schedule = (): void => {
    if (pending === 0) pending = requestAnimationFrame(update);
  };

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  // Fires when the page moves to a screen with a different pixel ratio.
  let dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const onDprChange = (): void => {
    dprQuery.removeEventListener('change', onDprChange);
    dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', onDprChange);
    schedule();
  };
  dprQuery.addEventListener('change', onDprChange);

  return {
    get current() {
      return current;
    },
    setMaxPixelRatio(value) {
      cap = value;
      update();
    },
    dispose() {
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      dprQuery.removeEventListener('change', onDprChange);
      if (pending !== 0) cancelAnimationFrame(pending);
      probe.remove();
    },
  };
}
