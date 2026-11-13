/**
 * Review screenshots for docs/screenshots/phase-03/. Not part of the normal test run: start it with
 *   SCREENSHOTS=1 npx playwright test screenshots
 * Each shot opens a fixed seed, optionally swings the beam left with the keyboard, waits, and saves.
 */
import { expect, test } from '@playwright/test';

const OUT = 'docs/screenshots/phase-03';
/** Read without Node's type definitions (the project doesn't depend on them). */
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
const PORTRAIT = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

interface Shot {
  name: string;
  query: string;
  size: { width: number; height: number };
  /** Hold the left arrow this long (ms) to swing the beam toward the western reef. */
  swing?: number;
  wait: number;
}

const night = '?seed=42&quality=high';
const shots: Shot[] = [
  { name: 'portrait-night', query: night, size: PORTRAIT, wait: 10000 },
  { name: 'desktop-night', query: night, size: DESKTOP, wait: 10000 },
  { name: 'portrait-reefs', query: night, size: PORTRAIT, swing: 900, wait: 2500 },
  { name: 'desktop-reefs', query: night, size: DESKTOP, swing: 900, wait: 2500 },
  { name: 'desktop-late-night', query: night, size: DESKTOP, wait: 26000 },
  { name: 'portrait-ship-parade', query: `${night}&parade`, size: PORTRAIT, wait: 2500 },
  { name: 'desktop-ship-parade', query: `${night}&parade`, size: DESKTOP, wait: 2500 },
  {
    name: 'desktop-all-buildings',
    query: `${night}&buildings=all`,
    size: DESKTOP,
    swing: 900,
    wait: 2500,
  },
  ...(['low', 'medium', 'high'] as const).map((q) => ({
    name: `desktop-quality-${q}`,
    query: `?seed=42&quality=${q}`,
    size: DESKTOP,
    swing: 900,
    wait: 2500,
  })),
  ...(['harborBay', 'northernIce', 'stormStrait', 'smugglersCove', 'archipelago'] as const).map(
    (r) => ({
      name: `desktop-region-${r}`,
      query: `${night}&region=${r}`,
      size: DESKTOP,
      swing: 900,
      wait: 2500,
    }),
  ),
];

test.describe('phase 03 screenshots', () => {
  test.skip(!env?.SCREENSHOTS, 'Set SCREENSHOTS=1 to take the review screenshots.');
  test.describe.configure({ timeout: 60_000 });

  for (const shot of shots) {
    test(shot.name, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.setViewportSize(shot.size);
      await page.goto(`/${shot.query}`);
      await expect(page.locator('#fade')).toHaveCSS('opacity', '0');
      if (shot.swing) {
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(shot.swing);
        await page.keyboard.up('ArrowLeft');
      }
      await page.waitForTimeout(shot.wait);
      await page.screenshot({ path: `${OUT}/${shot.name}.png` });
      expect(errors).toEqual([]);
    });
  }
});
