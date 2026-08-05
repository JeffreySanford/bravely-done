import { createAuthedClient, uniqueEmail } from '../support/auth-client';

/** Real integration coverage for the Daily reward loop (documentation/
 * product/rewards-retention.md's Daily cadence): Today's Three designation
 * and the two completion-triggered bonuses. Hits the actual running backend
 * and a real Postgres database, unlike quest.service.spec.ts's mocked-Prisma
 * unit tests. Each test signs up its own user, so every character starts
 * with an unclaimed First Brave Step for the current UTC day. */
describe('Daily reward loop (integration)', () => {
  const QUEST_XP = 20;
  const QUEST_COINS = 10;
  const FIRST_BRAVE_STEP_XP = 10;
  const FIRST_BRAVE_STEP_COINS = 5;
  const TODAYS_THREE_XP = 10;
  const TODAYS_THREE_COINS = 5;

  async function createCharacterWithQuests(titles: string[]) {
    const client = createAuthedClient();
    await client.post('/api/auth/signup', { email: uniqueEmail('daily'), password: 'Password123456!' });
    const character = await client.post('/api/characters', { name: 'Daily Scout' });
    const characterId = character.data.id;
    const questIds: string[] = [];
    for (const title of titles) {
      const quest = await client.post(`/api/characters/${characterId}/quests`, { title });
      questIds.push(quest.data.id);
    }
    return { client, characterId, questIds };
  }

  it('grants the First Brave Step bonus on the first completion of the day, but not the second', async () => {
    const { client, questIds } = await createCharacterWithQuests(['One', 'Two']);

    const first = await client.post(`/api/quests/${questIds[0]}/complete`, {});
    const second = await client.post(`/api/quests/${questIds[1]}/complete`, {});

    expect(first.data.firstBraveStepBonusGranted).toBe(true);
    expect(first.data.character.xp).toBe(QUEST_XP + FIRST_BRAVE_STEP_XP);
    expect(second.data.firstBraveStepBonusGranted).toBe(false);
    expect(second.data.character.xp).toBe(QUEST_XP + FIRST_BRAVE_STEP_XP + QUEST_XP);
  });

  it("grants the Today's Three bonus for a designated quest", async () => {
    const { client, questIds } = await createCharacterWithQuests(['Warm up', 'Starred']);
    // Burn the First Brave Step on an undesignated quest so the second
    // completion isolates the Today's Three bonus on its own.
    await client.post(`/api/quests/${questIds[0]}/complete`, {});
    await client.post(`/api/quests/${questIds[1]}/todays-three`);

    const res = await client.post(`/api/quests/${questIds[1]}/complete`, {});

    expect(res.data.firstBraveStepBonusGranted).toBe(false);
    expect(res.data.todaysThreeBonusGranted).toBe(true);
    expect(res.data.character.xp).toBe(QUEST_XP + FIRST_BRAVE_STEP_XP + QUEST_XP + TODAYS_THREE_XP);
    expect(res.data.character.coins).toBe(QUEST_COINS + FIRST_BRAVE_STEP_COINS + QUEST_COINS + TODAYS_THREE_COINS);
  });

  it('stacks both daily bonuses when the first completion is also a designated quest', async () => {
    const { client, questIds } = await createCharacterWithQuests(['Starred and first']);
    await client.post(`/api/quests/${questIds[0]}/todays-three`);

    const res = await client.post(`/api/quests/${questIds[0]}/complete`, {});

    expect(res.data.firstBraveStepBonusGranted).toBe(true);
    expect(res.data.todaysThreeBonusGranted).toBe(true);
    expect(res.data.character.xp).toBe(QUEST_XP + FIRST_BRAVE_STEP_XP + TODAYS_THREE_XP);
    expect(res.data.character.coins).toBe(QUEST_COINS + FIRST_BRAVE_STEP_COINS + TODAYS_THREE_COINS);
  });

  it('reports isTodaysThree on designate and clears it on undesignate', async () => {
    const { client, questIds } = await createCharacterWithQuests(['Toggle me']);

    const designated = await client.post(`/api/quests/${questIds[0]}/todays-three`);
    expect(designated.data.isTodaysThree).toBe(true);

    const undesignated = await client.delete(`/api/quests/${questIds[0]}/todays-three`);
    expect(undesignated.data.isTodaysThree).toBe(false);
  });

  it('rejects designating more than three quests in a day, and frees a slot on undesignate', async () => {
    const { client, questIds } = await createCharacterWithQuests(['One', 'Two', 'Three', 'Four']);
    for (const id of questIds.slice(0, 3)) {
      await client.post(`/api/quests/${id}/todays-three`);
    }

    await expect(client.post(`/api/quests/${questIds[3]}/todays-three`)).rejects.toMatchObject({
      response: { status: 400 },
    });

    await client.delete(`/api/quests/${questIds[0]}/todays-three`);
    const fourth = await client.post(`/api/quests/${questIds[3]}/todays-three`);
    expect(fourth.data.isTodaysThree).toBe(true);
  });

  it('rejects designating an already-resolved quest', async () => {
    const { client, questIds } = await createCharacterWithQuests(['Already done']);
    await client.post(`/api/quests/${questIds[0]}/complete`, {});

    await expect(client.post(`/api/quests/${questIds[0]}/todays-three`)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it('does not grant either daily bonus on split — a split is not "you finished something today"', async () => {
    const { client, questIds } = await createCharacterWithQuests(['Split me']);
    await client.post(`/api/quests/${questIds[0]}/todays-three`);

    const res = await client.post(`/api/quests/${questIds[0]}/split`, {});

    expect(res.data.firstBraveStepBonusGranted).toBe(false);
    expect(res.data.todaysThreeBonusGranted).toBe(false);
    // Half credit only — no daily bonus leaked in.
    expect(res.data.character.xp).toBe(QUEST_XP / 2);
    expect(res.data.character.coins).toBe(QUEST_COINS / 2);
  });
});
