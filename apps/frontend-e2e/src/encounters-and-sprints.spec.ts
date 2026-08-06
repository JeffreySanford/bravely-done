import { expect, test } from '@playwright/test';
import {
  COURAGE_XP,
  addQuest,
  newPlayer,
  openBoard,
  questCard,
  statLine,
} from './support/journey';

test('adding and completing an encounter grants Courage XP without touching the quest', async ({
  page,
}) => {
  // Encounters are a checklist within a quest, independent of the quest's
  // own resolution — no gating, no retreat-equivalent. Completing one
  // grants Courage XP ("for beginning avoided work") while the quest stays
  // exactly where it was.
  await newPlayer(page);
  await openBoard(page);
  await addQuest(page, 'Answer three emails');

  const card = questCard(page, 'Answer three emails');
  const input = card.getByPlaceholder('Add a step…');
  await input.fill('Draft the reply');
  // Enter rather than clicking "+": this form once silently fell back to a
  // native full-page submit because the component imported only
  // ReactiveFormsModule, and submitting by key is the path that caught it.
  await input.press('Enter');
  await expect(card.getByText('Draft the reply')).toBeVisible();

  const check = card.locator('.encounter-item__check');
  await check.click();
  await expect(check).toBeDisabled();

  await expect(page.getByText(statLine(COURAGE_XP, 0))).toBeVisible();
  // The quest itself is untouched — still in Backlog, still startable.
  await expect(
    questCard(page, 'Answer three emails').getByRole('button', {
      name: 'Start',
    }),
  ).toBeVisible();
});

test('a sprint runs a real start/pause/resume round trip with the idle-timer gate visible', async ({
  page,
}) => {
  // The idle-timer-resistance guarantee (rewards-retention.md) made visible
  // in the UI: "Finish sprint" stays disabled because real elapsed time
  // hasn't reached the target. Reaching the success-after-target path needs
  // the target to genuinely elapse (shortest preset is 15 real minutes),
  // which isn't practical here — that path is covered by SprintService's
  // unit tests and a live verification against Postgres that backdates a
  // real stored timestamp rather than mocking the clock.
  await newPlayer(page);
  await openBoard(page);
  await addQuest(page, 'Chop firewood');

  const card = questCard(page, 'Chop firewood');
  await card.getByRole('button', { name: 'Start' }).click();
  await card.getByRole('button', { name: '15 min' }).click();

  await expect(card.getByRole('button', { name: 'Pause' })).toBeVisible();
  const finishSprint = card.getByRole('button', { name: 'Finish sprint' });
  await expect(finishSprint).toBeDisabled();

  await card.getByRole('button', { name: 'Pause' }).click();
  await expect(card.getByRole('button', { name: 'Resume' })).toBeVisible();
  await expect(finishSprint).toBeDisabled();

  await card.getByRole('button', { name: 'Resume' }).click();
  await expect(card.getByRole('button', { name: 'Pause' })).toBeVisible();
  // Still disabled after a full pause/resume cycle — pausing must not be a
  // way to shortcut the elapsed-time gate.
  await expect(finishSprint).toBeDisabled();
});
