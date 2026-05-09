import { test, expect } from '@playwright/test';

/**
 * Auth surface smoke — read-only.
 * Verifies the public auth pages render. Does NOT submit credentials
 * (live registration is rate-limited and would consume the 5/15min quota).
 */
test.describe('Auth pages', () => {
  test('login page renders email + password fields', async ({ page }) => {
    const resp = await page.goto('/login');
    expect(resp?.status() ?? 0).toBeLessThan(500);
    const email = page
      .locator('input[type="email"], input[name="email" i], input[id*="email" i]')
      .first();
    const password = page
      .locator('input[type="password"], input[name="password" i]')
      .first();
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
  });

  test('register page renders form fields', async ({ page }) => {
    const resp = await page.goto('/register');
    expect(resp?.status() ?? 0).toBeLessThan(500);
    const password = page.locator('input[type="password"]').first();
    await expect(password).toBeVisible();
  });
});
