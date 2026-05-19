import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { Browser, expect, test } from '@playwright/test';

type FreeProviderConfig = {
  id: 'ovh' | 'llm7' | 'pollinations' | 'kilo';
  model: string;
};

type ProviderRunResult = {
  provider: FreeProviderConfig['id'];
  model: string;
  status: 'success' | 'failed';
  summarySnippet: string;
  diagnostics?: string[];
  capturedAt: string;
  screenshotPath: string;
};

const AI_CONFIG_STORAGE_KEY = 'curriculum-tools.aiConfig.v1';
const LOCALE_STORAGE_KEY = 'curriculum-tools.locale.v1';

const freeProviders: FreeProviderConfig[] = [
  { id: 'ovh', model: 'Qwen3-32B' },
  { id: 'llm7', model: 'deepseek-v3-0324' },
  { id: 'pollinations', model: 'openai-fast' },
  { id: 'kilo', model: 'kilo-auto/free' },
];

const EVIDENCE_DIR = 'tests/e2e/evidence';
const EVIDENCE_JSON_PATH = `${EVIDENCE_DIR}/live-free-providers-candidate.json`;
const PER_PROVIDER_TIMEOUT_MS = 5 * 60 * 1000;
const CLEANUP_TIMEOUT_MS = 3000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const persistResults = (results: ProviderRunResult[]) => {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(
    EVIDENCE_JSON_PATH,
    `${JSON.stringify(results, null, 2)}\n`,
    'utf8',
  );
};

const appendResult = (result: ProviderRunResult) => {
  const existing: ProviderRunResult[] = existsSync(EVIDENCE_JSON_PATH)
    ? (JSON.parse(
        readFileSync(EVIDENCE_JSON_PATH, 'utf8'),
      ) as ProviderRunResult[])
    : [];

  const filtered = existing.filter(item => item.provider !== result.provider);
  filtered.push(result);
  persistResults(filtered);
};

const runCandidateFlow = async (
  provider: FreeProviderConfig,
  browser: Browser,
) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  let screenshotPath = `${EVIDENCE_DIR}/live-candidate-${provider.id}.png`;
  const diagnostics: string[] = [];

  page.on('requestfailed', request => {
    const failure = request.failure()?.errorText ?? 'unknown request failure';
    diagnostics.push(
      `requestfailed: ${request.method()} ${request.url()} -> ${failure}`,
    );
  });

  page.on('console', message => {
    if (message.type() === 'error') {
      diagnostics.push(`console.error: ${message.text()}`);
    }
  });

  let status: ProviderRunResult['status'] = 'failed';
  let summarySnippet = 'No candidate summary detected before timeout.';

  try {
    const config = {
      provider: provider.id,
      apiKey: '',
      model: provider.model,
      savedAt: new Date().toISOString(),
      redactSensitiveData: true,
    };

    await page.addInitScript(
      ({ localeKey, locale, configKey, configValue }) => {
        globalThis.localStorage.setItem(localeKey, locale);
        globalThis.localStorage.setItem(configKey, configValue);
      },
      {
        localeKey: LOCALE_STORAGE_KEY,
        locale: 'en-US',
        configKey: AI_CONFIG_STORAGE_KEY,
        configValue: JSON.stringify(config),
      },
    );

    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'AI tools for candidates and HR' }),
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Candidate' }).click();
    await page.getByLabel('Job title').fill('Frontend Engineer');
    await page
      .getByLabel('Job description')
      .fill('Build React applications, improve quality, and mentor teammates.');
    await page
      .getByLabel('CV text')
      .fill(
        'Delivered React features, improved test stability, and partnered with design and product.',
      );

    await expect(page.getByLabel('Job title')).toHaveValue('Frontend Engineer');
    await expect(page.getByLabel('Job description')).toHaveValue(
      'Build React applications, improve quality, and mentor teammates.',
    );
    await expect(page.getByLabel('CV text')).toHaveValue(
      'Delivered React features, improved test stability, and partnered with design and product.',
    );

    await page.getByRole('button', { name: 'Process' }).click();

    const recommendationsHeading = page.getByRole('heading', {
      name: 'Recommendations',
    });

    const completionSignal = await Promise.race([
      recommendationsHeading
        .waitFor({ state: 'visible', timeout: PER_PROVIDER_TIMEOUT_MS })
        .then(() => 'recommendations'),
      page
        .locator('[role="status"], [role="alert"]')
        .first()
        .waitFor({ state: 'visible', timeout: PER_PROVIDER_TIMEOUT_MS })
        .then(() => 'status'),
      page.waitForTimeout(PER_PROVIDER_TIMEOUT_MS).then(() => 'timeout'),
    ]);

    if (completionSignal === 'recommendations') {
      status = 'success';

      const summaryCard = page
        .locator('section, article, div')
        .filter({ hasText: 'Summary' })
        .first();
      const summaryText = (
        (await summaryCard.innerText().catch(() => '')) || ''
      ).trim();
      summarySnippet = summaryText.slice(0, 280);
    } else if (!page.isClosed()) {
      const statusText =
        (await page
          .locator('[role="status"], [role="alert"]')
          .first()
          .textContent({ timeout: 1000 })
          .catch(() => null)) ?? '';

      if (statusText.trim()) {
        summarySnippet = statusText.trim().slice(0, 280);
      } else if (completionSignal === 'timeout') {
        summarySnippet =
          'Timed out waiting for provider response in candidate flow.';
        if (diagnostics.length > 0) {
          summarySnippet = diagnostics[0].slice(0, 280);
        }
      }
    } else {
      summarySnippet =
        'Page closed before status text could be collected for this provider.';
    }
  } catch (error) {
    summarySnippet =
      error instanceof Error
        ? error.message.slice(0, 280)
        : 'Unknown runtime error.';
  } finally {
    mkdirSync(EVIDENCE_DIR, { recursive: true });

    if (!page.isClosed()) {
      try {
        await Promise.race([
          page.screenshot({ path: screenshotPath, fullPage: true }),
          sleep(CLEANUP_TIMEOUT_MS),
        ]);
      } catch {
        screenshotPath = '';
      }
    } else {
      screenshotPath = '';
    }

    await Promise.race([
      context.close().catch(() => undefined),
      sleep(CLEANUP_TIMEOUT_MS),
    ]);
  }

  return {
    provider: provider.id,
    model: provider.model,
    status,
    summarySnippet,
    diagnostics: diagnostics.slice(0, 10),
    capturedAt: new Date().toISOString(),
    screenshotPath,
  } satisfies ProviderRunResult;
};

test.describe('live free provider candidate evidence', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(5 * 60 * 1000);

  for (const provider of freeProviders) {
    test(`captures real candidate output for ${provider.id}`, async ({
      browser,
    }) => {
      const result = await runCandidateFlow(provider, browser);
      appendResult(result);
    });
  }
});
