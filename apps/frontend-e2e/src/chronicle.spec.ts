import { expect, test } from '@playwright/test';
import {
  FIRST_BRAVE_STEP_XP,
  QUEST_XP,
  SPLIT_XP,
  addQuest,
  newPlayer,
  openBoard,
  questCard,
} from './support/journey';

/**
 * The Chronicle is a real route, not another Base Camp overlay. This spec
 * builds a small but genuinely varied history — one of each resolution —
 * and then reads it back, because the Chronicle's whole job is reporting
 * what actually happened rather than what a fixture claims happened.
 */
test('the chronicle reports every kind of resolution, honestly and without judgement', async ({
  page,
}) => {
  await newPlayer(page);
  await openBoard(page);

  await addQuest(page, 'Answer three emails');
  await addQuest(page, 'Split me later');
  await addQuest(page, 'Take a rest day');

  const completed = questCard(page, 'Answer three emails');
  await completed.getByRole('button', { name: 'Start' }).click();
  await completed.getByRole('button', { name: 'Complete' }).click();
  await expect(
    questCard(page, 'Answer three emails').getByText('Done'),
  ).toBeVisible();

  const split = questCard(page, 'Split me later');
  await split.getByRole('button', { name: 'Start' }).click();
  await split.getByRole('button', { name: 'Split' }).click();
  await expect(
    questCard(page, 'Split me later').getByText('Split', { exact: true }),
  ).toBeVisible();

  // Retreat and split were both invisible to any summary before
  // Quest.resolvedAt existed — completedAt only ever marked COMPLETED.
  await questCard(page, 'Take a rest day')
    .getByRole('button', { name: 'Retreat' })
    .click();
  await expect(
    questCard(page, 'Take a rest day').getByText('Retreated'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('link', { name: 'Chronicle' }).click();

  await expect(page).toHaveURL(/\/basecamp\/[^/]+\/chronicle$/);
  await expect(page.getByRole('heading', { name: 'Chronicle' })).toBeVisible();

  await expect(page.getByText('Answer three emails').first()).toBeVisible();
  await expect(page.getByText('Split me later').first()).toBeVisible();
  await expect(page.getByText('Take a rest day').first()).toBeVisible();

  // Retreating is legitimate play, so the Chronicle says "Stepped back
  // from" and never frames a week as a failure.
  await expect(page.getByText('Stepped back from').first()).toBeVisible();
  await expect(page.getByText(/failed|abandoned|gave up/i)).toHaveCount(0);

  // Real earned XP from the reward ledger, not an estimate: one completion
  // (with the day's First Brave Step bonus) plus one split.
  const expectedXp = QUEST_XP + FIRST_BRAVE_STEP_XP + SPLIT_XP;
  // Scoped to the headline rather than a bare getByText on the number —
  // "40" appears in several places on this page, so a loose match could
  // pass for the wrong reason.
  await expect(page.locator('.chronicle__earned-headline')).toContainText(
    `${expectedXp}`,
  );
  await expect(page.getByText('XP earned')).toBeVisible();
  // Categories are shown by their player-facing names, not enum values.
  await expect(page.getByText('Quests completed')).toBeVisible();
  await expect(page.getByText('FIRST_BRAVE_STEP')).toHaveCount(0);

  await page.getByRole('link', { name: 'Back to Base Camp' }).click();
  await expect(page.getByRole('heading', { name: 'Base Camp' })).toBeVisible();
});

test('a brand-new character sees an honest quiet week, not an error', async ({
  page,
}) => {
  await newPlayer(page);
  await page.getByRole('link', { name: 'Chronicle' }).click();

  await expect(page.getByRole('heading', { name: 'Chronicle' })).toBeVisible();
  await expect(page.getByText('A quiet week.')).toBeVisible();
  await expect(page.getByText('nothing was lost')).toBeVisible();
});
