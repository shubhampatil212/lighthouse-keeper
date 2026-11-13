/**
 * Full screen (Settings → Display, also reached from Pause → Settings). Browsers only allow it from a
 * tap, so it isn't saved: it's a switch for this visit. Hidden where full screen isn't available
 * (iPhone Safari) and when the game already runs as an installed app, which is full screen anyway.
 */
import { isInstalled } from '../app/pwa';
import { toggle } from './kit/controls';

/** Safari's older prefixed names (not in TypeScript's DOM types). */
interface WebkitDocument {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | undefined;
}
interface WebkitElement {
  webkitRequestFullscreen?: () => Promise<void> | undefined;
}

const doc = (): Document & WebkitDocument => document;

export function fullscreenAvailable(): boolean {
  const d = doc();
  return !isInstalled() && (d.fullscreenEnabled || d.webkitFullscreenEnabled === true);
}

export function isFullscreen(): boolean {
  const d = doc();
  return (d.fullscreenElement ?? d.webkitFullscreenElement ?? null) !== null;
}

export async function setFullscreen(on: boolean): Promise<void> {
  const d = doc();
  const root = document.documentElement as HTMLElement & WebkitElement;
  try {
    if (on && !isFullscreen()) {
      if (d.fullscreenEnabled) await root.requestFullscreen({ navigationUI: 'hide' });
      else await root.webkitRequestFullscreen?.();
    } else if (!on && isFullscreen()) {
      if (d.fullscreenElement) await d.exitFullscreen();
      else await d.webkitExitFullscreen?.();
    }
  } catch {
    // Refused (no tap, or the browser said no): the switch shows the real state below.
  }
}

/** A "Full screen" switch that follows the real state (Esc or the system can leave full screen). */
export function fullscreenToggle(label: string): HTMLButtonElement | null {
  if (!fullscreenAvailable()) return null;
  const sync = (): void => {
    if (!b.isConnected) {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      return;
    }
    b.setAttribute('aria-checked', String(isFullscreen()));
  };
  const b = toggle(label, isFullscreen(), (on) => {
    void setFullscreen(on).then(sync);
  });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  return b;
}
