import { expect, test } from '@playwright/test';
import {
  FIRST_BRAVE_STEP_COINS,
  FIRST_BRAVE_STEP_XP,
  QUEST_COINS,
  QUEST_XP,
  addQuest,
  newPlayer,
  openBoard,
  questCard,
  statLine,
  trackConsoleErrors,
} from './support/journey';

/**
 * The core loop, kept deliberately sequential: create → start → complete,
 * three times, then reload and confirm nothing was lost.
 *
 * This is the one spec that stays a long linear journey on purpose. What
 * it proves isn't any single interaction — those are covered by the
 * focused specs alongside it — but that real state survives every step in
 * sequence and then a page reload, backed by Postgres rather than client
 * memory. Splitting it further would lose exactly that property.
 */
test('completing quests advances the bridge, grants rewards, and survives a reload', async ({
  page,
}) => {
  const consoleErrors = trackConsoleErrors(page);

  await newPlayer(page);
  await openBoard(page);

  const titles = ['Chop firewood', 'Answer three emails', 'Forage berries'];
  for (const title of titles) {
    await addQuest(page, title);
  }

  for (const [index, title] of titles.entries()) {
    const card = questCard(page, title);
    await card.getByRole('button', { name: 'Start' }).click();
    await expect(card.getByRole('button', { name: 'Complete' })).toBeVisible();

    await card.getByRole('button', { name: 'Complete' }).click();
    // One plank per completion, up to fully repaired.
    await expect(
      page.getByText(`Bridge repair: ${index + 1} / 3`),
    ).toBeVisible();
    await expect(questCard(page, title).getByText('Done')).toBeVisible();
  }

  // Three completions at QUEST_XP/QUEST_COINS each, plus the Daily loop's
  // First Brave Step bonus on the day's first completion (this character
  // is brand new, so its first completion is always the day's first).
  const expectedXp = 3 * QUEST_XP + FIRST_BRAVE_STEP_XP;
  const expectedCoins = 3 * QUEST_COINS + FIRST_BRAVE_STEP_COINS;
  await expect(
    page.getByText(statLine(expectedXp, expectedCoins)),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Base Camp' })).toBeVisible();
  await expect(
    page.getByText(statLine(expectedXp, expectedCoins)),
  ).toBeVisible();

  // The board defaults to closed again after a reload — reopening it is
  // what proves the underlying quest state persisted, not just the header.
  await openBoard(page);
  await expect(page.getByText('Bridge repair: 3 / 3')).toBeVisible();
  for (const title of titles) {
    await expect(questCard(page, title).getByText('Done')).toBeVisible();
  }

  expect(consoleErrors).toEqual([]);
});
