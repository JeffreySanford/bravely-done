import { expect, test } from '@playwright/test';
import {
  FIRST_BRAVE_STEP_COINS,
  FIRST_BRAVE_STEP_XP,
  QUEST_COINS,
  QUEST_XP,
  TODAYS_THREE_COINS,
  TODAYS_THREE_XP,
  addQuest,
  newPlayer,
  openBoard,
  questCard,
  statLine,
} from './support/journey';

/**
 * The Daily reward loop (rewards-retention.md's Daily cadence). Both
 * bonuses fire only on a real completion — never on login or elapsed
 * time — which is what keeps them idle-timer-resistant.
 */
test('starring a quest and completing it earns both daily bonuses, and the toast names them', async ({
  page,
}) => {
  await newPlayer(page);
  await openBoard(page);
  await addQuest(page, 'Chop firewood');

  // The star toggle designates the quest as one of Today's Three.
  const card = questCard(page, 'Chop firewood');
  await card.getByRole('button', { name: "Add to Today's Three" }).click();
  await expect(
    card.getByRole('button', { name: "Remove from Today's Three" }),
  ).toBeVisible();

  await card.getByRole('button', { name: 'Start' }).click();
  await card.getByRole('button', { name: 'Complete' }).click();

  // Both bonuses land on this one completion: First Brave Step (the day's
  // first completion for a brand-new character) and Today's Three (this
  // quest was starred).
  const expectedXp = QUEST_XP + FIRST_BRAVE_STEP_XP + TODAYS_THREE_XP;
  const expectedCoins =
    QUEST_COINS + FIRST_BRAVE_STEP_COINS + TODAYS_THREE_COINS;
  await expect(
    page.getByText(statLine(expectedXp, expectedCoins)),
  ).toBeVisible();

  // The toast names which bonuses fired rather than just showing a bigger
  // number — the reward is legible, not just larger.
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: "First Brave Step + Today's Three bonus!" }),
  ).toBeVisible();
});

test('the First Brave Step bonus is granted once, not on every completion that day', async ({
  page,
}) => {
  await newPlayer(page);
  await openBoard(page);
  await addQuest(page, 'First quest');
  await addQuest(page, 'Second quest');

  const first = questCard(page, 'First quest');
  await first.getByRole('button', { name: 'Start' }).click();
  await first.getByRole('button', { name: 'Complete' }).click();
  await expect(
    page.getByText(
      statLine(
        QUEST_XP + FIRST_BRAVE_STEP_XP,
        QUEST_COINS + FIRST_BRAVE_STEP_COINS,
      ),
    ),
  ).toBeVisible();

  const second = questCard(page, 'Second quest');
  await second.getByRole('button', { name: 'Start' }).click();
  await second.getByRole('button', { name: 'Complete' }).click();

  // The second completion earns the plain quest reward only — the bonus is
  // once per UTC day, not per completion.
  await expect(
    page.getByText(
      statLine(
        2 * QUEST_XP + FIRST_BRAVE_STEP_XP,
        2 * QUEST_COINS + FIRST_BRAVE_STEP_COINS,
      ),
    ),
  ).toBeVisible();
});
