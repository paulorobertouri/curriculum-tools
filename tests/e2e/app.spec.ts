import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

const EVIDENCE_DIR = 'tests/e2e/evidence';
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

test.describe('Curriculum Tools', () => {
  test('loads the application homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/error/i);
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, '01_homepage.png'),
      fullPage: true,
    });
  });
});
