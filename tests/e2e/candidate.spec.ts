import { expect, test } from '@playwright/test';

import {
  captureJourneyScreenshot,
  routeOpenAiForCandidateFlows,
  seedSavedConfig,
} from './utils';

test.describe('Candidate Journey', () => {
  test.beforeEach(async ({ page }) => {
    await routeOpenAiForCandidateFlows(page);
    await page.goto('/');
    await seedSavedConfig(page);
    await page.reload();
  });

  test('renders processed review result', async ({ page }) => {
    await page.getByLabel('Job title').fill('Staff Engineer');
    await page.getByLabel('Job description').fill('Expert in React.');
    await page.getByLabel('CV text').fill('Built many React apps.');

    await page.getByRole('button', { name: 'Process' }).click();

    await expect(
      page.getByRole('heading', { name: 'Review Result' }),
    ).toBeVisible();

    await expect(page.getByText('Analysis complete')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/Score/i).first()).toBeVisible();
    await expect(page.getByText('Scorecard')).toBeVisible();
    await expect(page.getByText('Safety').first()).toBeVisible();
    await expect(page.getByText('Skill analysis')).toBeVisible();

    await captureJourneyScreenshot(page, 'candidate', '00-review-result');
  });

  test('extracts uploaded CV files', async ({ page }) => {
    await page.getByLabel('Job title').fill('Frontend Developer');
    await page.getByLabel('Job description').fill('React expertise required.');

    await page.locator('#candidate-file').setInputFiles({
      name: 'alice.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Built large React apps.'),
    });

    await expect(page.getByText('alice.txt is ready')).toBeVisible();
    await captureJourneyScreenshot(page, 'candidate', '01-upload-ready');

    await page.getByRole('button', { name: 'Process' }).click();

    await expect(page.getByText('Analysis complete')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/Score/i).first()).toBeVisible();
    await expect(page.getByText('Scorecard')).toBeVisible();
    await captureJourneyScreenshot(page, 'candidate', '02-upload-result');
  });
});
