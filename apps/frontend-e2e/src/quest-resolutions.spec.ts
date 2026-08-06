import { expect, test } from '@playwright/test';
import {
  SPLIT_COINS,
  SPLIT_XP,
  addQuest,
  newPlayer,
  openBoard,
  questCard,
  statLine,
} from './support/journey';

/**
 * The three resolutions that aren't "complete". Each is a genuinely
 * different outcome — different reward, different column, different
 * framing — and asserting them separately means a regression names itself
 * instead of surfacing as a failure somewhere inside a long journey.
 */

test('retreating is available straight from the Backlog and grants nothing', async ({
  page,
}) => {
  // Retreat is deliberately penalty-free — "rest days and comeback quests
  // are legitimate play" (rewards-retention.md's ethical rules) — so it
  // needs no Start first, and moves no reward.
  await newPlayer(page);
  await openBoard(page);
  await addQuest(page, 'Take a rest day');

  await questCard(page, 'Take a rest day')
    .getByRole('button', { name: 'Retreat' })
    .click();

  await expect(
    questCard(page, 'Take a rest day').getByText('Retreated'),
  ).toBeVisible();
  await expect(page.getByText(statLine(0, 0))).toBeVisible();
});

test('splitting grants half credit and moves the quest to its own column', async ({
  page,
}) => {
  await newPlayer(page);
  await openBoard(page);
  await addQuest(page, 'Split me later');

  // Split, like Complete and Continue, is only offered on In Progress
  // cards — partial credit implies work was actually started.
  const card = questCard(page, 'Split me later');
  await card.getByRole('button', { name: 'Start' }).click();
  await card.getByRole('button', { name: 'Split' }).click();

  await expect(
    questCard(page, 'Split me later').getByText('Split', { exact: true }),
  ).toBeVisible();
  // Half of QUEST_XP/QUEST_COINS, rounded down. Deliberately no First Brave
  // Step bonus: a split is "won't be finished as scoped", which doesn't
  // match that bonus's "you finished something today" framing.
  await expect(page.getByText(statLine(SPLIT_XP, SPLIT_COINS))).toBeVisible();

  // The accessible celebration toast (role="status", aria-live="polite") —
  // a real reward announcement, not just a visual flourish.
  await expect(
    page.getByRole('status').filter({ hasText: `+${SPLIT_XP} XP` }),
  ).toBeVisible();
});

test('continuing keeps a quest in progress and grants no reward', async ({
  page,
}) => {
  // "Continue" (game-loop.md: "meaningful progress made; another encounter
  // remains") records that a session happened without resolving the quest —
  // so it must not move the card or change any total.
  await newPlayer(page);
  await openBoard(page);
  await addQuest(page, 'Long refactor');

  const card = questCard(page, 'Long refactor');
  await card.getByRole('button', { name: 'Start' }).click();
  await card.getByRole('button', { name: 'Continue' }).click();

  // Still In Progress: Complete is still offered, and it hasn't moved to Done.
  await expect(
    questCard(page, 'Long refactor').getByRole('button', { name: 'Complete' }),
  ).toBeVisible();
  await expect(
    questCard(page, 'Long refactor').getByText('Done'),
  ).not.toBeVisible();
  await expect(page.getByText(statLine(0, 0))).toBeVisible();
});
