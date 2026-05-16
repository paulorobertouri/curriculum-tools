import { expect, test } from '@playwright/test';

const routeOpenAiForSetupOnly = async (
  page: Parameters<typeof test>[0]['page'],
) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ output_text: 'hello' }),
    });
  });
};

const routeOpenAiForAllFlows = async (
  page: Parameters<typeof test>[0]['page'],
) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    const body = route.request().postDataJSON() as { input?: string };
    const prompt = body.input ?? '';

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
            strengths: ['Strong React and TypeScript delivery'],
            gaps: ['Limited leadership examples'],
            recommendations: ['Quantify outcomes in recent projects'],
            rewrittenBullets: [
              'Led React migration improving release cadence by 20%',
            ],
          }),
        }),
      });
      return;
    }

    if (prompt.includes('Rank these CVs against the target role')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({
            candidates: [
              {
                id: 'candidate-1',
                filename: 'alice.txt',
                detectedName: 'Alice',
                score: 9.1,
                justification: 'Strong alignment with role requirements.',
                strengths: ['System design', 'Mentoring'],
                concerns: ['Limited domain-specific certifications'],
                interviewRecommendation: 'strong_yes',
              },
              {
                id: 'candidate-2',
                filename: 'bob.txt',
                detectedName: 'Bob',
                score: 7.8,
                justification:
                  'Solid baseline with a few missing requirements.',
                strengths: ['React'],
                concerns: ['Less backend depth'],
                interviewRecommendation: 'yes',
              },
            ],
          }),
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ output_text: '{}' }),
    });
  });
};

const setupOpenAi = async (page: Parameters<typeof test>[0]['page']) => {
  await page.goto('/');
  await page.getByLabel('Provider').selectOption('openai');
  await page.getByLabel('API key').fill('sk-test-key');
  await page.getByRole('button', { name: 'Test and Save' }).click();

  await expect(
    page.getByRole('heading', { name: 'AI tools for candidates and HR' }),
  ).toBeVisible();
};

test('first run shows provider setup', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Curriculum Tools' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Test and Save' }),
  ).toBeVisible();
});

test('mocked provider setup unlocks the app', async ({ page }) => {
  await routeOpenAiForSetupOnly(page);
  await setupOpenAi(page);
});

test('candidate flow renders processed review result', async ({ page }) => {
  await routeOpenAiForAllFlows(page);
  await setupOpenAi(page);

  await page.getByLabel('Job title').fill('Frontend Engineer');
  await page
    .getByLabel('Job description')
    .fill('Build React applications and mentor peers.');
  await page
    .getByLabel('CV text')
    .fill('Built large React apps and improved developer workflow.');
  await page.getByRole('button', { name: 'Process' }).click();

  await expect(page.getByText('8.7', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Good fit for the role with clear impact.'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Recommendations' }),
  ).toBeVisible();
});

test('hr flow renders ranked candidates', async ({ page }) => {
  await routeOpenAiForAllFlows(page);
  await setupOpenAi(page);

  await page.getByRole('button', { name: 'HR' }).click();
  await page.getByLabel('Job title').fill('Engineering Manager');
  await page
    .getByLabel('Job description')
    .fill('Lead teams, mentor engineers, and own technical delivery.');

  await page.locator('#hr-files').setInputFiles([
    {
      name: 'alice.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'Candidate one CV text with management and architecture experience.',
      ),
    },
    {
      name: 'bob.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'Candidate two CV text with strong frontend execution.',
      ),
    },
  ]);

  await page.getByRole('button', { name: 'Process' }).click();

  await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bob' })).toBeVisible();
  await expect(page.getByText('Recommendation: strong yes')).toBeVisible();
});

test('hr flow chunks large batches into multiple ranking requests', async ({
  page,
}) => {
  let rankingRequestCount = 0;

  await page.route('https://api.openai.com/v1/responses', async route => {
    const body = route.request().postDataJSON() as { input?: string };
    const prompt = body.input ?? '';

    if (prompt.includes('Reply with only this exact word: hello')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ output_text: 'hello' }),
      });
      return;
    }

    if (prompt.includes('Rank these CVs against the target role')) {
      rankingRequestCount += 1;

      const ids = [...prompt.matchAll(/id:\s*([^\n]+)/g)].map(match =>
        match[1].trim(),
      );
      const filenames = [...prompt.matchAll(/filename:\s*([^\n]+)/g)].map(
        match => match[1].trim(),
      );

      const candidates = ids.map((id, index) => ({
        id,
        filename: filenames[index] ?? `${id}.txt`,
        score: Number((10 - index * 0.3).toFixed(1)),
        justification: `Ranked in chunk request ${rankingRequestCount}.`,
        strengths: ['Relevant experience'],
        concerns: ['Needs deeper evaluation'],
        interviewRecommendation: 'maybe',
      }));

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({ candidates }),
        }),
      });
      return;
    }

    if (prompt.includes('Evaluate this CV for the target role')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({
            score: 7.0,
            summary: 'ok',
            strengths: [],
            gaps: [],
            recommendations: [],
            rewrittenBullets: [],
          }),
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ output_text: '{}' }),
    });
  });

  await setupOpenAi(page);
  await page.getByRole('button', { name: 'HR' }).click();
  await page.getByLabel('Job title').fill('Senior Engineer');
  await page
    .getByLabel('Job description')
    .fill('Own architecture and delivery.');

  const files = Array.from({ length: 9 }, (_, index) => ({
    name: `candidate-${index + 1}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from(
      `Candidate ${index + 1} has relevant software engineering experience.`,
    ),
  }));

  await page.locator('#hr-files').setInputFiles(files);
  await page.getByRole('button', { name: 'Process' }).click();

  await expect(
    page.getByRole('heading', { name: 'candidate-1.txt' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'candidate-9.txt' }),
  ).toBeVisible();
  expect(rankingRequestCount).toBe(2);
});

test('hr flow keeps extraction errors visible while processing valid files', async ({
  page,
}) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    const body = route.request().postDataJSON() as { input?: string };
    const prompt = body.input ?? '';

    if (prompt.includes('Reply with only this exact word: hello')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ output_text: 'hello' }),
      });
      return;
    }

    if (prompt.includes('Rank these CVs against the target role')) {
      const ids = [...prompt.matchAll(/id:\s*([^\n]+)/g)].map(match =>
        match[1].trim(),
      );
      const filenames = [...prompt.matchAll(/filename:\s*([^\n]+)/g)].map(
        match => match[1].trim(),
      );

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          output_text: JSON.stringify({
            candidates: ids.map((id, index) => ({
              id,
              filename: filenames[index],
              detectedName: 'Valid Candidate',
              score: 8.1,
              justification: 'Valid file was ranked successfully.',
              strengths: ['Role-relevant experience'],
              concerns: [],
              interviewRecommendation: 'yes',
            })),
          }),
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ output_text: '{}' }),
    });
  });

  await setupOpenAi(page);
  await page.getByRole('button', { name: 'HR' }).click();
  await page.getByLabel('Job title').fill('Backend Engineer');
  await page
    .getByLabel('Job description')
    .fill('Build reliable backend systems.');

  await page.locator('#hr-files').setInputFiles([
    {
      name: 'legacy.doc',
      mimeType: 'application/msword',
      buffer: Buffer.from('legacy-doc-content'),
    },
    {
      name: 'valid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Valid candidate CV text with backend experience.'),
    },
  ]);

  await expect(page.getByText('legacy.doc')).toBeVisible();
  await expect(
    page.getByText(
      /Legacy \.doc files are not reliably supported in the browser/,
    ),
  ).toBeVisible();
  await expect(page.getByText('valid.txt')).toBeVisible();
  await expect(page.getByText('valid.txt · ready')).toBeVisible();

  await page.getByRole('button', { name: 'Process' }).click();

  await expect(
    page.getByRole('heading', { name: 'Valid Candidate' }),
  ).toBeVisible();
  await expect(page.getByText('Recommendation: yes')).toBeVisible();
});
