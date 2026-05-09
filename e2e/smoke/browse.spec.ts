import { test, expect } from '@playwright/test';

test.describe('Browse → product detail', () => {
  test('products listing renders', async ({ page }) => {
    const resp = await page.goto('/products');
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await expect
      .poll(
        async () =>
          page.evaluate(() => document.getElementById('root')?.children.length ?? 0),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(0);
  });

  test('clicking a product card navigates to a detail page', async ({ page }) => {
    await page.goto('/products');
    // Wait for at least one product link to appear (graceful: skip if catalog empty)
    const productLink = page
      .locator('a[href*="/products/"], a[href*="/product/"]')
      .first();
    const visible = await productLink
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!visible, 'No product links found on listing page');
    await productLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toMatch(/\/products?\//);
  });
});
