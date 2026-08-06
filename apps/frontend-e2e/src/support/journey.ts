import { expect, Locator, Page } from '@playwright/test';

/** The app initializer always calls GET /auth/me to check for an existing
 * cookie session (see restoreSessionInitializer); a fresh visitor with no
 * session correctly gets a 401, which the app handles gracefully
 * (AuthStateService.restoreSession's catchError) — but Chromium and WebKit
 * still log the underlying failed network response regardless. The message
 * for these browser-generated resource-load errors doesn't include the
 * request URL (only script console.error calls carry location info), so
 * this matches the one specific, otherwise-unambiguous expected message
 * rather than trying to filter by URL. */
const EXPECTED_UNAUTHENTICATED_SESSION_CHECK =
  'Failed to load resource: the server responded with a status of 401 (Unauthorized)';

/** Collects genuine console errors, ignoring the expected 401 above.
 * Assert `expect(errors).toEqual([])` at the end of a test. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      msg.text() !== EXPECTED_UNAUTHENTICATED_SESSION_CHECK
    ) {
      errors.push(msg.text());
    }
  });
  return errors;
}

/** WebGL is available in Chromium (bundled SwiftShader) and WebKit's own
 * software path, so the canvas (not the CSS grid-veil fallback) is what
 * should mount there. Headless Firefox on a GPU-less CI runner has no
 * software WebGL rasterizer even with webgl.force-enabled set (see
 * playwright.config.mts) — isWebglAvailable() then correctly reports false
 * and the app renders the grid-veil fallback, which is the intended
 * graceful degradation, not a bug. Assert on whichever path this
 * engine/environment actually produces. */
export async function expectSceneMounted(page: Page): Promise<void> {
  const canvas = page.locator('canvas.stage__canvas');
  const fallback = page.locator('.grid-veil');

  // Wait for whichever path this engine takes to actually appear *before*
  // branching. Sampling `canvas.isVisible()` directly is a race: it doesn't
  // retry, so calling it before the canvas paints silently takes the
  // fallback branch and then fails asserting a .grid-veil that a
  // WebGL-capable engine never renders. That produced a real intermittent
  // failure (~1 run in 4) once specs got short enough to reach this check
  // early. The template renders exactly one of the two, so this union
  // resolves unambiguously.
  await expect(canvas.or(fallback).first()).toBeAttached();

  if ((await canvas.count()) > 0) {
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  } else {
    await expect(fallback).toBeAttached();
  }
}

/** Signs up a brand-new account, creates a character, and leaves the page
 * in Base Camp on that character's first arrival.
 *
 * Every spec starts from a fresh player rather than sharing one: the specs
 * run concurrently across three browser projects, and several of them
 * assert on exact XP totals, which only hold for a character whose whole
 * history the test controls. */
export async function newPlayer(
  page: Page,
  characterName = 'Ember Scout',
): Promise<{ email: string; characterName: string }> {
  // Random suffix, not just Date.now(): the browser projects run
  // concurrently and can start within the same millisecond, which produced
  // a real, reproduced-once 409 email collision.
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('correcthorsebattery');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(
    page.getByRole('heading', { name: 'Name your character' }),
  ).toBeVisible();
  await page.getByLabel('Character name').fill(characterName);
  await page.getByRole('button', { name: 'Create character' }).click();

  await expect(page.getByRole('heading', { name: 'Base Camp' })).toBeVisible();
  return { email, characterName };
}

/** Opens the quest board overlay. Safe to call when it's already open. */
export async function openBoard(page: Page): Promise<void> {
  const bridgeLabel = page.getByText(/Bridge repair: \d \/ 3/);
  if (await bridgeLabel.isVisible().catch(() => false)) {
    return;
  }
  await page.getByRole('button', { name: 'Quests' }).click();
  await expect(bridgeLabel).toBeVisible();
}

export async function addQuest(page: Page, title: string): Promise<void> {
  await page.getByLabel('Quest title').fill(title);
  await page.getByRole('button', { name: 'Add quest' }).click();
  await expect(page.getByText(title)).toBeVisible();
}

/** The Kanban card for a quest, by its title. */
export function questCard(page: Page, title: string): Locator {
  return page.locator('.kanban-card', { hasText: title });
}

/** Quest XP/coin constants, mirrored from
 * apps/backend/src/quest/quest.service.ts. Kept here so a test's expected
 * total reads as arithmetic rather than a magic number — if a constant
 * changes, the failure points at the real cause. */
export const QUEST_XP = 20;
export const QUEST_COINS = 10;
export const SPLIT_XP = 10;
export const SPLIT_COINS = 5;
export const FIRST_BRAVE_STEP_XP = 10;
export const FIRST_BRAVE_STEP_COINS = 5;
export const TODAYS_THREE_XP = 10;
export const TODAYS_THREE_COINS = 5;
export const COURAGE_XP = 5;

/** The header's stat line. Level is client-side `floor(xp/100)+1`. */
export function statLine(xp: number, coins: number): string {
  return `Level ${Math.floor(xp / 100) + 1} — ${xp} XP — ${coins} coins`;
}
