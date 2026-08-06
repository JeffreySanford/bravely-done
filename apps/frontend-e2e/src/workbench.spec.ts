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
} from './support/journey';

const WORKBENCH_FIRST_UPGRADE_COST = 10;

test('coins earned from quests can be spent at the workbench, and the spend persists', async ({
  page,
}) => {
  // The coins total is shared state across two NgRx features: quests grant
  // it, camp spends it. This is the test that would catch that
  // cross-reducer sync breaking.
  await newPlayer(page);
  await openBoard(page);

  await addQuest(page, 'Earn some coins');
  const card = questCard(page, 'Earn some coins');
  await card.getByRole('button', { name: 'Start' }).click();
  await card.getByRole('button', { name: 'Complete' }).click();

  const earnedXp = QUEST_XP + FIRST_BRAVE_STEP_XP;
  const earnedCoins = QUEST_COINS + FIRST_BRAVE_STEP_COINS;
  await expect(page.getByText(statLine(earnedXp, earnedCoins))).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Workbench: level 0 / 3')).toBeVisible();
  await page
    .getByRole('button', {
      name: `Upgrade for ${WORKBENCH_FIRST_UPGRADE_COST} coins`,
    })
    .click();

  await expect(page.getByText('Workbench: level 1 / 3')).toBeVisible();
  const remainingCoins = earnedCoins - WORKBENCH_FIRST_UPGRADE_COST;
  await expect(
    page.getByText(statLine(earnedXp, remainingCoins)),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Base Camp' })).toBeVisible();
  await expect(page.getByText('Workbench: level 1 / 3')).toBeVisible();
  await expect(
    page.getByText(statLine(earnedXp, remainingCoins)),
  ).toBeVisible();
});
