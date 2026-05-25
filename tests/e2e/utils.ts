import { Page } from '@playwright/test';

export const captureJourneyScreenshot = async (
  page: Page,
  category: string,
  name: string,
) => {
  await page.screenshot({
    path: `tests/e2e/evidence/${category}/${name}.png`,
    fullPage: true,
  });
};

export const seedSavedConfig = async (page: Page) => {
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
};

export const routeOpenAiForSetupOnly = async (page: Page) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ output_text: 'hello' }),
    });
  });
};

export const routeOpenAiForCandidateFlows = async (page: Page) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    const body = route.request().postDataJSON() as {
      input?: string;
    };
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
            strengths: ['Frontend expert', 'Team player'],
            gaps: ['No cloud'],
            recommendations: ['Learn AWS'],
            rewrittenBullets: ['Optimized React components.'],
          }),
        }),
      });
      return;
    }

    if (prompt.includes('Create a practical candidate toolkit')) {
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

export const routeOpenAiForHrFlows = async (page: Page) => {
  await page.route('https://api.openai.com/v1/responses', async route => {
    const body = route.request().postDataJSON();
    const prompt = body?.input ?? '';

    if (
      prompt.includes('Rank the following candidate CVs') ||
      prompt.includes('Evaluate each CV against the target role')
    ) {
      const isAlice = prompt.includes('alice.txt') || prompt.includes('Alice');
      const isBob = prompt.includes('bob.txt') || prompt.includes('Bob');
      const isValid = prompt.includes('valid.txt') || prompt.includes('Valid');

      const candidates = [] as unknown[];

      if (isAlice) {
        candidates.push({
          id: 'candidate-1',
          filename: 'alice.txt',
          detectedName: 'Alice',
          score: 9.5,
          justification: 'Excellent match.',
          strengths: ['Expert'],
          concerns: [],
          interviewRecommendation: 'strong_yes',
          interviewQuestions: ['Q1'],
        });
      }

      if (isBob) {
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

      if (isValid) {
        candidates.push({
          id: 'candidate-v',
          filename: 'valid.txt',
          detectedName: 'Valid',
          score: 9.0,
          justification: 'OK',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
        });
      }

      // Fallback if none matched but it's a ranking request
      if (candidates.length === 0) {
        candidates.push({
          id: 'mock-id',
          filename: 'mock.txt',
          score: 8.5,
          justification: 'Justified',
          strengths: [],
          concerns: [],
          interviewRecommendation: 'yes',
          interviewQuestions: [],
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
