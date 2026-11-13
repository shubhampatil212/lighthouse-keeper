import { expect, test } from '@playwright/test';

test('every region, weather and quality can be switched on mid-night without console errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?seed=7&debug');
  await expect(page.locator('#fade')).toHaveCSS('opacity', '0');
  const panel = page.locator('.debug-panel');

  for (const region of [
    'northernIce',
    'stormStrait',
    'smugglersCove',
    'archipelago',
    'harborBay',
  ]) {
    await page.getByLabel('Region').selectOption(region);
    await page.waitForTimeout(150);
  }
  for (const weather of ['clear', 'fog', 'rain', 'snow', 'level']) {
    await page.getByLabel('Weather').selectOption(weather);
    await page.waitForTimeout(150);
  }
  for (const quality of ['low', 'high', 'medium']) {
    await page.getByLabel('Quality').selectOption(quality);
    await page.waitForTimeout(150);
    await expect(panel).toContainText(`quality ${quality}`);
  }
  await page.getByLabel('Quality').selectOption('auto');
  await expect(panel).toContainText('quality auto');

  await page.getByLabel('All buildings').check();
  await page.getByLabel('Ship parade').check();
  await page.getByLabel('Reveal all').check();
  await page.waitForTimeout(500);
  await page.getByLabel('Ship parade').uncheck();
  await page.getByRole('button', { name: 'Restart same seed' }).click();
  await page.waitForTimeout(500);

  expect(errors).toEqual([]);
});
