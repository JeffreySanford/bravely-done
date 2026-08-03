import { test, expect } from '@playwright/test';

test('loads the Angular application shell', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.ok()).toBe(true);
  await expect(page.locator('app-root')).toBeAttached();
  await expect(page.locator('router-outlet')).toBeAttached();
});
