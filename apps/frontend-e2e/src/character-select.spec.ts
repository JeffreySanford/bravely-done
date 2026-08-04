import { test, expect } from '@playwright/test';

/**
 * Full authenticated journey through to the Three.js character-select scene.
 * This is the real compensating evidence for game-rendering/ and
 * character-select-scene.ts — WebGL can't be meaningfully exercised in
 * jsdom unit tests (see testing-exceptions.md OPEN-004), but a real browser
 * here genuinely renders it.
 */
test('signup through to a rendered character-select scene', async ({ page }) => {
  // The app initializer always calls GET /auth/me on load to check for an
  // existing cookie session (see restoreSessionInitializer); a fresh visitor
  // with no session correctly gets a 401 there, which the app handles
  // gracefully (AuthStateService.restoreSession's catchError) — but Chromium
  // and WebKit still log the underlying failed network response to console
  // regardless of app-level handling. The console message text for these
  // browser-generated resource-load errors doesn't include the request URL
  // (only script console.error calls carry useful location info), so this
  // matches on the one specific, otherwise-unambiguous expected message
  // rather than trying to filter by URL.
  const EXPECTED_UNAUTHENTICATED_SESSION_CHECK = 'Failed to load resource: the server responded with a status of 401 (Unauthorized)';

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text() !== EXPECTED_UNAUTHENTICATED_SESSION_CHECK) {
      consoleErrors.push(msg.text());
    }
  });

  const email = `e2e-${Date.now()}@example.com`;

  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('correcthorsebattery');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('heading', { name: 'Name your character' })).toBeVisible();
  await page.getByLabel('Character name').fill('Ember Scout');
  await page.getByRole('button', { name: 'Create character' }).click();

  await expect(page.getByRole('heading', { name: 'Choose your character' })).toBeVisible();
  await expect(page.getByText('Ember Scout')).toBeVisible();

  // WebGL is available in real Playwright browsers, so the canvas (not the
  // CSS grid-veil fallback) should be what actually mounted.
  const canvas = page.locator('canvas.stage__canvas');
  await expect(canvas).toBeAttached();

  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
  expect(box?.height).toBeGreaterThan(0);

  expect(consoleErrors).toEqual([]);
});
