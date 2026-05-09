import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Solo E-Commerce E2E tests.
 *
 * Targets the deployed Static Web App by default. Override via:
 *   $env:E2E_BASE_URL = "http://localhost:3001"; npx playwright test
 *
 * Tests in `e2e/smoke/` are read-only and safe to run against production.
 * Tests in `e2e/write/` create + clean up real data and require admin creds.
 */
const baseURL =
  process.env.E2E_BASE_URL || 'https://agreeable-field-0fa189b0f.7.azurestaticapps.net';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
