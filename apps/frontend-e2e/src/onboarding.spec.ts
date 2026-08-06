import { expect, test } from '@playwright/test';
import {
  expectSceneMounted,
  newPlayer,
  trackConsoleErrors,
} from './support/journey';

/**
 * Signup → character creation → a rendered Base Camp → character select →
 * back again. This is the real compensating evidence for game-rendering/,
 * character-select-scene.ts, and base-camp-scene.ts — WebGL can't be
 * meaningfully exercised in jsdom unit tests (see testing-exceptions.md
 * OPEN-004), but a real browser here genuinely renders it.
 */
test('a new player signs up, creates a character, and lands in a rendered Base Camp', async ({
  page,
}) => {
  const consoleErrors = trackConsoleErrors(page);

  await newPlayer(page);

  // A brand-new character lands directly in Base Camp — the tent's
  // first-arrival moment (see documentation/product/base-camp.md).
  await expect(page.getByText('Ember Scout has arrived.')).toBeVisible();
  await expectSceneMounted(page);
  await expect(page.getByText('Level 1 — 0 XP — 0 coins')).toBeVisible();

  // The firewood/forage hint only renders when the WebGL scene actually
  // mounted (see expectSceneMounted's Firefox/CI note) — where it does, it
  // reflects the character's real backend counts, not placeholders.
  const canvasMounted = await page
    .locator('canvas.stage__canvas')
    .isVisible()
    .catch(() => false);
  if (canvasMounted) {
    await expect(
      page.getByText('Firewood: 0 — click a tree to chop wood.'),
    ).toBeVisible();
    await expect(
      page.getByText('Forage: 0 — click the bush to harvest.'),
    ).toBeVisible();
  }

  expect(consoleErrors).toEqual([]);
});

test('a player can leave Base Camp for character select and return to the same character', async ({
  page,
}) => {
  const consoleErrors = trackConsoleErrors(page);

  await newPlayer(page);
  await page.getByRole('link', { name: 'Back to characters' }).click();

  await expect(
    page.getByRole('heading', { name: 'Choose your character' }),
  ).toBeVisible();
  await expect(page.getByText('Ember Scout')).toBeVisible();
  await expectSceneMounted(page);

  // Returning to Base Camp via character select, not just via creation.
  await page.getByRole('link', { name: 'Ember Scout' }).click();

  await expect(page.getByRole('heading', { name: 'Base Camp' })).toBeVisible();
  // A returning character does not replay the tent-erect animation — the
  // subtitle still reads "has arrived", but this is a repeat, not the
  // first-ever arrival captured by the backend's hasArrivedAtCamp flag.
  await expect(page.getByText('Ember Scout has arrived.')).toBeVisible();
  await expectSceneMounted(page);

  expect(consoleErrors).toEqual([]);
});

test('the quest board is an on-demand overlay that opens, closes, and reopens', async ({
  page,
}) => {
  // The board is a toggle rather than an always-docked panel so it never
  // competes with the 3D scene for screen space when the player isn't
  // actively managing quests — see planning/02's UI polish notes for the
  // feedback that drove this.
  await newPlayer(page);

  await page.getByRole('button', { name: 'Quests' }).click();
  await expect(page.getByText('Bridge repair: 0 / 3')).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Bridge repair: 0 / 3')).toBeHidden();

  await page.getByRole('button', { name: 'Quests' }).click();
  await expect(page.getByText('Bridge repair: 0 / 3')).toBeVisible();
});
