import { createAuthedClient, uniqueEmail } from '../support/auth-client';

/** Real integration coverage for the reward ledger against the running
 * backend and a real Postgres. The load-bearing property is reconciliation:
 * summing every ledger row for a character must equal that character's
 * current xp/coins. If those ever diverge, the Chronicle is reporting
 * fiction — so this asserts it directly rather than trusting that each
 * grant remembered to write its row. */
describe('Reward ledger (integration)', () => {
  async function newCharacter(prefix: string) {
    const client = createAuthedClient();
    await client.post('/api/auth/signup', {
      email: uniqueEmail(prefix),
      password: 'Password123456!',
    });
    const character = await client.post('/api/characters', {
      name: 'Ledger Scout',
    });
    return { client, characterId: character.data.id as string };
  }

  async function createQuest(
    client: ReturnType<typeof createAuthedClient>,
    characterId: string,
    title: string,
  ) {
    const quest = await client.post(`/api/characters/${characterId}/quests`, {
      title,
    });
    return quest.data.id as string;
  }

  async function chronicle(
    client: ReturnType<typeof createAuthedClient>,
    characterId: string,
  ) {
    const res = await client.get(`/api/characters/${characterId}/chronicle`);
    return res.data;
  }

  async function balance(
    client: ReturnType<typeof createAuthedClient>,
    characterId: string,
  ) {
    const res = await client.get('/api/characters');
    return res.data.find((c: { id: string }) => c.id === characterId);
  }

  it('reports the real XP a completion granted, broken down by category', async () => {
    const { client, characterId } = await newCharacter('ledger-complete');
    const questId = await createQuest(client, characterId, 'Quest one');

    await client.post(`/api/quests/${questId}/complete`, {});
    const summary = await chronicle(client, characterId);

    // A brand-new character's first completion also earns First Brave Step,
    // so this is QUEST (20/10) + FIRST_BRAVE_STEP (10/5).
    expect(summary.xpEarned).toBe(30);
    expect(summary.coinsEarned).toBe(15);
    const categories = summary.rewardBreakdown
      .map((r: { category: string }) => r.category)
      .sort();
    expect(categories).toEqual(['FIRST_BRAVE_STEP', 'QUEST']);
  });

  it('records a split under its own category, not as a quest completion', async () => {
    const { client, characterId } = await newCharacter('ledger-split');
    const questId = await createQuest(client, characterId, 'Split me');

    await client.post(`/api/quests/${questId}/split`, {});
    const summary = await chronicle(client, characterId);

    expect(summary.rewardBreakdown).toEqual([
      expect.objectContaining({ category: 'SPLIT', xp: 10, coins: 5 }),
    ]);
  });

  it('writes no ledger rows for a retreat, which grants nothing', async () => {
    const { client, characterId } = await newCharacter('ledger-retreat');
    const questId = await createQuest(client, characterId, 'Rest day');

    await client.post(`/api/quests/${questId}/retreat`, {});
    const summary = await chronicle(client, characterId);

    expect(summary.xpEarned).toBe(0);
    expect(summary.coinsEarned).toBe(0);
    expect(summary.rewardBreakdown).toEqual([]);
  });

  it('does not double-write the ledger when a duplicate idempotency key replays a completion', async () => {
    const { client, characterId } = await newCharacter('ledger-idem');
    const questId = await createQuest(client, characterId, 'Complete once');

    await client.post(`/api/quests/${questId}/complete`, {
      idempotencyKey: 'ledger-key',
    });
    await client.post(`/api/quests/${questId}/complete`, {
      idempotencyKey: 'ledger-key',
    });
    const summary = await chronicle(client, characterId);

    expect(summary.xpEarned).toBe(30);
  });

  it('reconciles against the character balance, including after a coin spend', async () => {
    const { client, characterId } = await newCharacter('ledger-reconcile');

    // Earn enough to afford a workbench upgrade.
    for (const title of ['One', 'Two']) {
      const questId = await createQuest(client, characterId, title);
      await client.post(`/api/quests/${questId}/complete`, {});
    }

    const beforeSpend = await balance(client, characterId);
    const beforeSummary = await chronicle(client, characterId);
    expect(beforeSummary.xpEarned).toBe(beforeSpend.xp);
    expect(beforeSummary.coinsEarned).toBe(beforeSpend.coins);

    await client.post(`/api/characters/${characterId}/upgrade-workbench`, {});

    // The spend is what makes this test worth having: a rewards-only ledger
    // would still report the pre-spend coin total here and silently diverge.
    const afterSpend = await balance(client, characterId);
    const afterSummary = await chronicle(client, characterId);
    expect(afterSummary.coinsEarned).toBe(afterSpend.coins);
    expect(afterSummary.coinsEarned).toBeLessThan(beforeSummary.coinsEarned);
    expect(
      afterSummary.rewardBreakdown.some(
        (r: { category: string; coins: number }) =>
          r.category === 'WORKBENCH_UPGRADE' && r.coins < 0,
      ),
    ).toBe(true);
  });

  it("never exposes another character's ledger", async () => {
    const { characterId } = await newCharacter('ledger-owner');
    const other = createAuthedClient();
    await other.post('/api/auth/signup', {
      email: uniqueEmail('ledger-intruder'),
      password: 'Password123456!',
    });

    await expect(
      other.get(`/api/characters/${characterId}/chronicle`),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
