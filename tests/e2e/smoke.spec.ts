import { expect, test } from '@playwright/test';

const sizes = [
  { name: 'portrait phone', width: 390, height: 844 },
  { name: 'landscape phone', width: 844, height: 390 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const size of sizes) {
  test(`loads with a canvas and no console errors (${size.name})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('/');

    const canvas = page.locator('#stage canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBe(size.width);
    expect(box?.height).toBe(size.height);

    // The fade-in finishes once the play scene has entered.
    await expect(page.locator('#fade')).toHaveCSS('opacity', '0');
    // Let a few frames render so draw-time errors would show up.
    await page.waitForTimeout(500);

    expect(errors).toEqual([]);
  });
}
