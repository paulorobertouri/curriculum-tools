import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const chromiumExecutableCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/snap/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter((candidate): candidate is string => Boolean(candidate));

const chromiumExecutablePath = chromiumExecutableCandidates.find(candidate =>
  existsSync(candidate),
);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'on', // Capture screenshot for every test
    video: 'on-first-retry',
    launchOptions: chromiumExecutablePath
      ? {
          executablePath: chromiumExecutablePath,
        }
      : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
  },
});
