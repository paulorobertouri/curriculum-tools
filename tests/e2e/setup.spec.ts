import { expect, test } from '@playwright/test';

import { captureJourneyScreenshot, routeOpenAiForSetupOnly } from './utils';

test.describe('Setup Journey', () => {
  test('first run shows provider setup', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Curriculum Tools' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Test and Save' }),
    ).toBeVisible();
    await captureJourneyScreenshot(page, 'setup', '00-first-run');
  });

  test('mocked provider setup unlocks the app', async ({ page }) => {
    await routeOpenAiForSetupOnly(page);
    await page.goto('/');
    await page.getByLabel('API key').fill('sk-mock-key');
    await page.getByRole('button', { name: 'Test and Save' }).click();

    await expect(
      page.getByRole('heading', { name: 'AI tools for candidates and HR' }),
    ).toBeVisible();
  });
});
