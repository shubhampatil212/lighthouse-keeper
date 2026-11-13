/**
 * The installable app (PWA): registers the service worker that keeps the game working offline
 * (built by tools/vite/serviceWorker.ts, production builds only), and keeps the browser's
 * "install" offer so the title screen can show its own Install button.
 */

/** Chrome's install offer (not in TypeScript's DOM types). */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installOffer: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    // Relative to the page, so it works at the site root and under GitHub Pages' /<repository>/.
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  // Keep the offer for our own button instead of the browser's mini bar.
  event.preventDefault();
  installOffer = event as InstallPromptEvent;
  for (const notify of listeners) notify();
});
window.addEventListener('appinstalled', () => {
  installOffer = null;
  for (const notify of listeners) notify();
});

/** True when the game is running as an installed app (from the home screen). */
export function isInstalled(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return (
    iosStandalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
  );
}

/** How this browser can add the game to the home screen: its own prompt, Safari's Share menu, or not at all. */
export function installRoute(): 'prompt' | 'ios' | null {
  if (isInstalled()) return null;
  if (installOffer) return 'prompt';
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
  // Only Safari itself can add to the home screen on iOS; other iOS browsers say nothing.
  const safari = iOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return safari ? 'ios' : null;
}

/** Shows the browser's install prompt (Android Chrome). Resolves true if the player accepted. */
export async function promptInstall(): Promise<boolean> {
  const offer = installOffer;
  if (!offer) return false;
  installOffer = null;
  await offer.prompt();
  const choice = await offer.userChoice;
  return choice.outcome === 'accepted';
}

/** Calls `notify` when the install offer arrives or goes; returns a function that stops it. */
export function onInstallChange(notify: () => void): () => void {
  listeners.add(notify);
  return () => listeners.delete(notify);
}
