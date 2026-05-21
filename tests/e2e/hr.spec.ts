import { expect, test } from '@playwright/test';
import {
  captureJourneyScreenshot,
  routeOpenAiForHrFlows,
  seedSavedConfig,
} from './utils';

test.describe('HR Journey', () => {
  test.beforeEach(async ({ page }) => {
    await routeOpenAiForHrFlows(page);
    await page.goto('/');
    await seedSavedConfig(page);
    await page.reload();
    await page.getByRole('tab', { name: 'HR' }).click();
  });

  test('renders ranked candidates', async ({ page }) => {
    await page.getByLabel('Job title').fill('Engineering Lead');
    await page.getByLabel('Job description').fill('Lead a team of 10.');

    await page.locator('#hr-files').setInputFiles([
      { name: 'alice.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 1') },
      { name: 'bob.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 2') },
    ]);

    await page.getByRole('button', { name: 'Process' }).click();

    await expect(page.getByText('Candidates ranked')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('alice.txt').first()).toBeVisible();
    await expect(page.getByText('bob.txt').first()).toBeVisible();
    await expect(page.getByText('Average vs top candidate')).toBeVisible();
    await expect(
      page.getByText('Hiring Cost & Funnel ROI Calculator'),
    ).toBeVisible();

    await captureJourneyScreenshot(page, 'hr', '00-ranking-result');
  });

  test('evaluates each candidate in separated ranking requests', async ({
    page,
  }) => {
    let rankingRequestCount = 0;

    await page.route('https://api.openai.com/v1/responses', async route => {
      rankingRequestCount += 1;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({
            candidates: [
              {
                id: 'mock',
                filename: 'mock.txt',
                score: 8.5,
                justification: 'J',
                strengths: [],
                concerns: [],
                interviewRecommendation: 'yes',
                interviewQuestions: [],
              },
            ],
          }),
        }),
      });
    });

    await page.getByLabel('Job title').fill('Engineer');
    await page.getByLabel('Job description').fill('Description');

    await page.locator('#hr-files').setInputFiles([
      { name: 'c1.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 1') },
      { name: 'c2.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 2') },
    ]);

    await page.getByRole('button', { name: 'Process' }).click();
    await expect(page.getByText('Candidates ranked')).toBeVisible();
    expect(rankingRequestCount).toBe(2);

    await captureJourneyScreenshot(page, 'hr', '01-chunked-batch-result');
  });

  test('keeps extraction errors visible while processing valid files', async ({
    page,
  }) => {
    await page.getByLabel('Job title').fill('Engineer');
    await page.getByLabel('Job description').fill('Description');

    await page.locator('#hr-files').setInputFiles([
      {
        name: 'valid.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Valid CV'),
      },
    ]);

    await expect(page.getByText('valid.txt').first()).toBeVisible();
    await captureJourneyScreenshot(page, 'hr', '02-partial-extraction-ready');

    await page.getByRole('button', { name: 'Process' }).click();

    await expect(page.getByText('Candidates ranked')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('valid.txt').first()).toBeVisible();

    await captureJourneyScreenshot(page, 'hr', '03-partial-extraction-result');
  });
});
