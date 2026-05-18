import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    channel: 'chrome',
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'on', // Capture screenshot for every test
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chrome', ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
  },
});
