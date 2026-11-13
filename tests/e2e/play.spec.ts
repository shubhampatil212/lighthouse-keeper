import { expect, test } from '@playwright/test';

test('the debug panel opens with ` and the night runs without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?seed=42');
  await expect(page.locator('#fade')).toHaveCSS('opacity', '0');

  const panel = page.locator('.debug-panel');
  await expect(panel).toBeHidden();
  await page.keyboard.press('`');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('seed 42');

  // Swing the beam with a finger-like drag, then with the keyboard.
  const canvas = page.locator('#stage canvas');
  await canvas.dispatchEvent('pointerdown', {
    clientX: 300,
    clientY: 200,
    pointerId: 1,
    pointerType: 'touch',
  });
  await canvas.dispatchEvent('pointerup', {
    clientX: 300,
    clientY: 200,
    pointerId: 1,
    pointerType: 'touch',
  });
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowLeft');

  await page.getByLabel('Reveal all').check();
  await page.getByLabel('Drag to rotate').check();
  await page.getByRole('button', { name: 'New seed' }).click();
  await expect(panel).not.toContainText('seed 42');

  // Ships spawn from 1.5 s in; let a couple of seconds of the night play.
  await page.waitForTimeout(2500);
  await expect(panel).toContainText(/ships: [1-9] at sea/);
  await expect(page.locator('.hud')).toContainText('The cargo run');

  // Phones have no ` key, so the panel can hide itself and come back from a small tab.
  await page.getByRole('button', { name: 'Hide panel' }).click();
  await expect(panel).toBeHidden();
  await page.getByRole('button', { name: 'Debug' }).click();
  await expect(panel).toBeVisible();
  expect(errors).toEqual([]);
});
