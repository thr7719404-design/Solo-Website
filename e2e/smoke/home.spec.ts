import { test, expect } from '@playwright/test';

test.describe('Homepage smoke', () => {
  test('home page loads with SPA root + title', async ({ page }) => {
    const resp = await page.goto('/');
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await expect(page).toHaveTitle(/Solo/i);
    // Wait for the SPA root to render at least one child element (hydrated)
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const r = document.getElementById('root');
            return r ? r.children.length : 0;
          }),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
  });

  test('no uncaught browser errors above critical threshold', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    expect(errors.length).toBeLessThan(3);
  });
});
