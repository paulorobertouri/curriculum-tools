import { expect, test } from '@playwright/test';

import { captureJourneyScreenshot, seedSavedConfig } from './utils';

test.describe('Quality Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedSavedConfig(page);
    await page.reload();
    await page.getByRole('tab', { name: 'Quality' }).click();
  });

  test('runs fixtures and stores run metrics', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Evaluation Harness', exact: true }),
    ).toBeVisible();

    await page.route('https://api.openai.com/v1/responses', async route => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({
            score: 8.5,
            summary: 'Review',
            strengths: ['S'],
            gaps: [],
            recommendations: [],
            rewrittenBullets: [],
            rewrittenCv: '...',
            coverLetter: '...',
            interviewQa: [],
            candidates: [
              {
                id: 'c',
                filename: 'f',
                score: 9,
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

    await page.getByRole('button', { name: 'Run fixture pack' }).click();

    await expect(page.getByText('Runs stored')).toBeVisible();
    await expect(page.getByText('Score drift monitor')).toBeVisible();
    await captureJourneyScreenshot(page, 'quality', '00-harness-run');
  });
});
