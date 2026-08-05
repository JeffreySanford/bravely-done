import { createAuthedClient, uniqueEmail } from '../support/auth-client';

/** Real integration coverage for the quest resolution endpoints — hits the
 * actual running backend and a real Postgres database (see support/
 * auth-client.ts and jest.config.cjs), unlike quest.service.spec.ts's
 * mocked-Prisma unit tests. Each test signs up its own user so the tests
 * stay independent of each other and of whatever data already exists in
 * the dev database. */
describe('Quest resolution (integration)', () => {
  async function createQuest(title: string) {
    const client = createAuthedClient();
    await client.post('/api/auth/signup', { email: uniqueEmail('quest-res'), password: 'Password123456!' });
    const character = await client.post('/api/characters', { name: 'Integration Scout' });
    const characterId = character.data.id;
    const quest = await client.post(`/api/characters/${characterId}/quests`, { title });
    return { client, characterId, questId: quest.data.id };
  }

  // Every test here signs up a fresh character, so its very first completion
  // always also earns the Daily reward loop's First Brave Step bonus
  // (FIRST_BRAVE_STEP_XP_REWARD = 10 / COIN = 5) on top of QUEST_XP_REWARD =
  // 20 / QUEST_COIN_REWARD = 10 — hence 30/15, not 20/10.
  const FIRST_COMPLETION_XP = 30;
  const FIRST_COMPLETION_COINS = 15;

  it('completes a quest and grants deterministic XP/coins', async () => {
    const { client, questId } = await createQuest('Complete me');

    const res = await client.post(`/api/quests/${questId}/complete`, {});

    expect(res.status).toBe(201);
    expect(res.data.quest.status).toBe('COMPLETED');
    expect(res.data.character.xp).toBe(FIRST_COMPLETION_XP);
    expect(res.data.character.coins).toBe(FIRST_COMPLETION_COINS);
    expect(res.data.firstBraveStepBonusGranted).toBe(true);
    expect(res.data.todaysThreeBonusGranted).toBe(false);
  });

  it('does not grant a reward twice for a repeat complete call', async () => {
    const { client, questId } = await createQuest('Complete twice');

    await client.post(`/api/quests/${questId}/complete`, {});
    const res = await client.post(`/api/quests/${questId}/complete`, {});

    expect(res.data.character.xp).toBe(FIRST_COMPLETION_XP);
    expect(res.data.character.coins).toBe(FIRST_COMPLETION_COINS);
  });

  it('splits a quest for half credit and leaves it resolved', async () => {
    const { client, questId } = await createQuest('Split me');

    const res = await client.post(`/api/quests/${questId}/split`, {});

    expect(res.data.quest.status).toBe('SPLIT');
    expect(res.data.character.xp).toBe(10);
    expect(res.data.character.coins).toBe(5);
  });

  it('retreats a quest with no reward', async () => {
    const { client, questId } = await createQuest('Retreat me');

    const res = await client.post(`/api/quests/${questId}/retreat`, {});

    expect(res.data.status).toBe('RETREATED');
  });

  it('continue re-stamps lastContinuedAt on each genuinely distinct call', async () => {
    const { client, questId } = await createQuest('Continue me');

    const first = await client.post(`/api/quests/${questId}/continue`, { idempotencyKey: 'int-key-1' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await client.post(`/api/quests/${questId}/continue`, { idempotencyKey: 'int-key-2' });

    expect(first.data.status).toBe('IN_PROGRESS');
    expect(new Date(second.data.lastContinuedAt).getTime()).toBeGreaterThan(
      new Date(first.data.lastContinuedAt).getTime(),
    );
  });

  it('a duplicate idempotency key on continue does not re-stamp (protects a network retry)', async () => {
    const { client, questId } = await createQuest('Continue retry');

    const first = await client.post(`/api/quests/${questId}/continue`, { idempotencyKey: 'int-key-dup' });
    const retry = await client.post(`/api/quests/${questId}/continue`, { idempotencyKey: 'int-key-dup' });

    expect(retry.data.lastContinuedAt).toBe(first.data.lastContinuedAt);
  });

  it('a duplicate idempotency key on complete does not grant the reward twice', async () => {
    const { client, questId } = await createQuest('Complete retry');

    await client.post(`/api/quests/${questId}/complete`, { idempotencyKey: 'int-key-complete' });
    const retry = await client.post(`/api/quests/${questId}/complete`, { idempotencyKey: 'int-key-complete' });

    expect(retry.data.character.xp).toBe(FIRST_COMPLETION_XP);
    expect(retry.data.character.coins).toBe(FIRST_COMPLETION_COINS);
  });

  it('rejects a resolution call for a quest not owned by the caller', async () => {
    const { questId } = await createQuest('Belongs to someone else');
    const otherClient = createAuthedClient();
    await otherClient.post('/api/auth/signup', { email: uniqueEmail('quest-res-other'), password: 'Password123456!' });

    await expect(otherClient.post(`/api/quests/${questId}/complete`, {})).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
