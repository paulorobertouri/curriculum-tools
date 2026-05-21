import { Page, expect, test } from '@playwright/test';

const captureJourneyScreenshot = async (page: Page, name: string) => {
  await page.screenshot({
    path: `tests/e2e/evidence/${name}.png`,
    fullPage: true,
  });
};

const routeOpenAiForSetupOnly = async (page: Page) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ output_text: 'hello' }),
    });
  });
};

const routeOpenAiForCandidateFlows = async (page: Page) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    const body = route.request().postDataJSON() as {
      input?: string;
    };
    const prompt = body.input ?? '';

    console.log('E2E MOCK PROMPT:', prompt.slice(0, 100));

    if (prompt.includes('Reply with only this exact word: hello')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ output_text: 'hello' }),
      });
      return;
    }

    if (prompt.includes('Evaluate this CV for the target role')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({
            score: 8.7,
            summary: 'Good fit for the role with clear impact.',
            strengths: ['Frontend expert', 'Team player'],
            gaps: ['No cloud'],
            recommendations: ['Learn AWS'],
            rewrittenBullets: ['Optimized React components.'],
          }),
        }),
      });
      return;
    }

    if (prompt.includes('Rewrite the following CV')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({
            rewrittenCv: 'Optimized CV content.',
            coverLetter: 'Strong cover letter.',
            interviewQa: [
              { question: 'Q1', suggestedAnswer: 'A1' },
              { question: 'Q2', suggestedAnswer: 'A2' },
            ],
          }),
        }),
      });
      return;
    }

    await route.abort();
  });
};

const routeOpenAiForHrFlows = async (page: Page) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    const body = route.request().postDataJSON() as {
      input?: string;
    };
    const prompt = body.input ?? '';

    if (prompt.includes('Rank the following candidate CVs')) {
      const candidates = [
        {
          id: 'candidate-1',
          filename: 'alice.txt',
          detectedName: 'Alice',
          score: 9.5,
          justification: 'Excellent match.',
          strengths: ['Expert'],
          concerns: [],
          interviewRecommendation: 'strong_yes',
          interviewQuestions: ['Q1'],
        },
      ];

      if (prompt.includes('bob.txt')) {
        candidates.push({
          id: 'candidate-2',
          filename: 'bob.txt',
          detectedName: 'Bob',
          score: 8.2,
          justification: 'Solid match.',
          strengths: ['Dev'],
          concerns: ['Junior'],
          interviewRecommendation: 'yes',
          interviewQuestions: ['Q2'],
        });
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({ candidates }),
        }),
      });
      return;
    }

    await route.abort();
  });
};

test.describe.configure({ mode: 'serial' });

test('first run shows provider setup', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Curriculum Tools' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Test and Save' }),
  ).toBeVisible();
  await captureJourneyScreenshot(page, 'setup-00-first-run');
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

test('candidate flow renders processed review result', async ({ page }) => {
  await routeOpenAiForCandidateFlows(page);
  await page.goto('/');

  await page.evaluate(() => {
    const config = {
      provider: 'openai',
      apiKey: 'sk-mock',
      model: 'gpt-mock',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      'curriculum-tools.aiConfig.v1',
      JSON.stringify(config),
    );
  });

  await page.reload();

  await page.getByLabel('Job title').fill('Staff Engineer');
  await page.getByLabel('Job description').fill('Expert in React.');
  await page.getByLabel('CV text').fill('Built many React apps.');

  await page.getByRole('button', { name: 'Process' }).click();

  const scoreLabel = await page.getByText(/Score/i).first();
  await expect(scoreLabel).toBeVisible();
  
  await expect(page.getByText('Scorecard')).toBeVisible();
  await expect(page.getByText('Safety').first()).toBeVisible();
  await expect(page.getByText('Skill analysis')).toBeVisible();

  await captureJourneyScreenshot(page, 'candidate-00-review-result');
});

test('candidate flow extracts uploaded CV files', async ({ page }) => {
  await routeOpenAiForCandidateFlows(page);
  await page.goto('/');

  await page.evaluate(() => {
    const config = {
      provider: 'openai',
      apiKey: 'sk-mock',
      model: 'gpt-mock',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      'curriculum-tools.aiConfig.v1',
      JSON.stringify(config),
    );
  });

  await page.reload();

  await page.locator('#candidate-file').setInputFiles({
    name: 'alice.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Built large React apps.'),
  });

  await expect(page.getByText('alice.txt')).toBeVisible();
  await page.getByRole('button', { name: 'Process' }).click();

  await expect(page.getByText(/Score/i).first()).toBeVisible();
  await expect(page.getByText('Scorecard')).toBeVisible();
  await captureJourneyScreenshot(page, 'candidate-02-upload-result');
});

test('hr flow renders ranked candidates', async ({ page }) => {
  await routeOpenAiForHrFlows(page);
  await page.goto('/');

  await page.evaluate(() => {
    const config = {
      provider: 'openai',
      apiKey: 'sk-mock',
      model: 'gpt-mock',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      'curriculum-tools.aiConfig.v1',
      JSON.stringify(config),
    );
  });

  await page.reload();

  await page.getByRole('tab', { name: 'HR' }).click();
  await page.getByLabel('Job title').fill('Engineering Lead');
  await page.getByLabel('Job description').fill('Lead a team of 10.');

  await page.locator('#hr-files').setInputFiles([
    { name: 'alice.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 1') },
    { name: 'bob.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 2') },
  ]);

  await page.getByRole('button', { name: 'Process' }).click();

  await expect(page.getByText('alice.txt').first()).toBeVisible();
  await expect(page.getByText('bob.txt').first()).toBeVisible();
  await expect(page.getByText('Average vs top candidate')).toBeVisible();
  await expect(
    page.getByText('Hiring Cost & Funnel ROI Calculator'),
  ).toBeVisible();

  await captureJourneyScreenshot(page, 'hr-00-ranking-result');
});

test('hr flow evaluates each candidate in separated ranking requests', async ({
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

  await page.goto('/');
  await page.evaluate(() => {
    const config = {
      provider: 'openai',
      apiKey: 'sk-mock',
      model: 'gpt-mock',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      'curriculum-tools.aiConfig.v1',
      JSON.stringify(config),
    );
  });
  await page.reload();

  await page.getByRole('tab', { name: 'HR' }).click();
  await page.locator('#hr-files').setInputFiles([
    { name: 'c1.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 1') },
    { name: 'c2.txt', mimeType: 'text/plain', buffer: Buffer.from('CV 2') },
  ]);

  await page.getByRole('button', { name: 'Process' }).click();
  await expect(page.getByText('Candidates ranked')).toBeVisible();
  expect(rankingRequestCount).toBe(2);
});

test('quality harness runs fixtures and stores run metrics', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => {
    const config = {
      provider: 'openai',
      apiKey: 'sk-mock',
      model: 'gpt-mock',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      'curriculum-tools.aiConfig.v1',
      JSON.stringify(config),
    );
  });
  await page.reload();

  await page.getByRole('tab', { name: 'Quality' }).click();

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

  await page.getByRole('button', { name: 'Run Evaluation' }).click();
  await expect(page.getByText('Evaluation complete').first()).toBeVisible();
  await expect(page.getByText('Score drift monitor')).toBeVisible();
  await captureJourneyScreenshot(page, 'quality-00-harness-run');
});
