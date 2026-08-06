import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EncounterStatus,
  QuestStatus,
  SprintStatus,
} from '../generated/prisma/enums';
import { CHRONICLE_MAX_ENTRIES, ChronicleService } from './chronicle.service';
import { ChronicleEntryKind } from './dto/chronicle.dto';

function buildPrismaMock() {
  return {
    character: { findFirst: jest.fn().mockResolvedValue({ id: 'char-1' }) },
    quest: { findMany: jest.fn().mockResolvedValue([]) },
    sprint: { findMany: jest.fn().mockResolvedValue([]) },
    encounter: { findMany: jest.fn().mockResolvedValue([]) },
    rewardEntry: { groupBy: jest.fn().mockResolvedValue([]) },
  };
}

describe('ChronicleService', () => {
  let service: ChronicleService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  /** quest.findMany is called twice — first for resolved quests, then for
   * continued ones — so tests stub them positionally. */
  function stubQuests(resolved: unknown[], continued: unknown[] = []) {
    prisma.quest.findMany
      .mockResolvedValueOnce(resolved)
      .mockResolvedValueOnce(continued);
  }

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new ChronicleService(prisma as unknown as PrismaService);
  });

  it('counts each quest resolution separately, including retreats', async () => {
    stubQuests([
      {
        title: 'A',
        status: QuestStatus.COMPLETED,
        resolvedAt: new Date('2026-08-06T10:00:00Z'),
      },
      {
        title: 'B',
        status: QuestStatus.COMPLETED,
        resolvedAt: new Date('2026-08-06T11:00:00Z'),
      },
      {
        title: 'C',
        status: QuestStatus.SPLIT,
        resolvedAt: new Date('2026-08-06T12:00:00Z'),
      },
      {
        title: 'D',
        status: QuestStatus.RETREATED,
        resolvedAt: new Date('2026-08-06T13:00:00Z'),
      },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.questsCompleted).toBe(2);
    expect(result.questsSplit).toBe(1);
    expect(result.questsRetreated).toBe(1);
  });

  it('derives focus minutes from each sprint target, not from elapsed time', async () => {
    prisma.sprint.findMany.mockResolvedValue([
      {
        targetSeconds: 900,
        completedAt: new Date('2026-08-06T10:00:00Z'),
        quest: { title: 'A' },
      },
      {
        targetSeconds: 1500,
        completedAt: new Date('2026-08-06T11:00:00Z'),
        quest: { title: 'B' },
      },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.sprintsCompleted).toBe(2);
    expect(result.focusMinutes).toBe(40);
  });

  it('counts a continued quest once, however many times it was continued', async () => {
    // lastContinuedAt only records the most recent continue, so one row is
    // all the data there is — reporting it as one quest is the honest read.
    stubQuests(
      [],
      [
        {
          title: 'Long haul',
          lastContinuedAt: new Date('2026-08-06T10:00:00Z'),
        },
      ],
    );

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.questsContinued).toBe(1);
    expect(result.entries).toEqual([
      expect.objectContaining({
        kind: ChronicleEntryKind.QUEST_CONTINUED,
        title: 'Long haul',
      }),
    ]);
  });

  it('returns a truthful empty chronicle for a quiet week rather than failing', async () => {
    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.entries).toEqual([]);
    expect(result.questsCompleted).toBe(0);
    expect(result.questsRetreated).toBe(0);
    expect(result.focusMinutes).toBe(0);
  });

  it('orders entries newest first across every source', async () => {
    stubQuests([
      {
        title: 'Quest',
        status: QuestStatus.COMPLETED,
        resolvedAt: new Date('2026-08-06T09:00:00Z'),
      },
    ]);
    prisma.sprint.findMany.mockResolvedValue([
      {
        targetSeconds: 900,
        completedAt: new Date('2026-08-06T12:00:00Z'),
        quest: { title: 'Sprint quest' },
      },
    ]);
    prisma.encounter.findMany.mockResolvedValue([
      { title: 'Encounter', completedAt: new Date('2026-08-06T10:30:00Z') },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.entries.map((entry) => entry.kind)).toEqual([
      ChronicleEntryKind.SPRINT_COMPLETED,
      ChronicleEntryKind.ENCOUNTER_COMPLETED,
      ChronicleEntryKind.QUEST_COMPLETED,
    ]);
  });

  it('names a sprint entry after its quest, so the entry reads as something recognizable', async () => {
    prisma.sprint.findMany.mockResolvedValue([
      {
        targetSeconds: 900,
        completedAt: new Date('2026-08-06T12:00:00Z'),
        quest: { title: 'Answer three emails' },
      },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.entries[0].title).toBe('Answer three emails');
  });

  it('truncates the entry list but keeps the summary counts complete', async () => {
    const many = Array.from(
      { length: CHRONICLE_MAX_ENTRIES + 20 },
      (_, index) => ({
        title: `Quest ${index}`,
        status: QuestStatus.COMPLETED,
        resolvedAt: new Date(Date.now() - index * 1000),
      }),
    );
    stubQuests(many);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.entries).toHaveLength(CHRONICLE_MAX_ENTRIES);
    expect(result.questsCompleted).toBe(CHRONICLE_MAX_ENTRIES + 20);
  });

  it('queries a window starting at midnight UTC so today is covered whole', async () => {
    await service.forCharacter('user-1', 'char-1', 7);

    const where = prisma.quest.findMany.mock.calls[0][0].where;
    const from: Date = where.resolvedAt.gte;
    expect(from.getUTCHours()).toBe(0);
    expect(from.getUTCMinutes()).toBe(0);
    expect(from.getUTCSeconds()).toBe(0);
  });

  it('covers today plus the preceding days for a multi-day window', async () => {
    const result = await service.forCharacter('user-1', 'char-1', 7);

    const spanDays =
      (result.to.getTime() - result.from.getTime()) / (24 * 60 * 60 * 1000);
    // Today is partial, so the span is six whole days plus however far into
    // today it currently is.
    expect(spanDays).toBeGreaterThanOrEqual(6);
    expect(spanDays).toBeLessThan(7);
    expect(result.days).toBe(7);
  });

  it('only counts completed sprints and encounters', async () => {
    await service.forCharacter('user-1', 'char-1');

    expect(prisma.sprint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: SprintStatus.COMPLETED }),
      }),
    );
    expect(prisma.encounter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: EncounterStatus.COMPLETED }),
      }),
    );
  });

  it('reports real XP and coins earned, summed from the ledger', async () => {
    prisma.rewardEntry.groupBy.mockResolvedValue([
      { category: 'QUEST', _sum: { xp: 60, coins: 30 } },
      { category: 'FOCUS', _sum: { xp: 15, coins: 0 } },
      { category: 'FIRST_BRAVE_STEP', _sum: { xp: 10, coins: 5 } },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.xpEarned).toBe(85);
    expect(result.coinsEarned).toBe(35);
  });

  it('nets spends against grants, so a heavy-spending week can go negative on coins', async () => {
    prisma.rewardEntry.groupBy.mockResolvedValue([
      { category: 'QUEST', _sum: { xp: 20, coins: 10 } },
      { category: 'WORKBENCH_UPGRADE', _sum: { xp: 0, coins: -25 } },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.coinsEarned).toBe(-15);
  });

  it('breaks the rewards down by category, largest first', async () => {
    prisma.rewardEntry.groupBy.mockResolvedValue([
      { category: 'FOCUS', _sum: { xp: 15, coins: 0 } },
      { category: 'QUEST', _sum: { xp: 60, coins: 30 } },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.rewardBreakdown).toEqual([
      { category: 'QUEST', xp: 60, coins: 30 },
      { category: 'FOCUS', xp: 15, coins: 0 },
    ]);
  });

  it('omits categories that moved nothing', async () => {
    prisma.rewardEntry.groupBy.mockResolvedValue([
      { category: 'QUEST', _sum: { xp: 20, coins: 10 } },
      { category: 'COURAGE', _sum: { xp: 0, coins: 0 } },
    ]);

    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.rewardBreakdown).toHaveLength(1);
    expect(result.rewardBreakdown[0].category).toBe('QUEST');
  });

  it('reports zero rather than null for a week with no reward rows', async () => {
    const result = await service.forCharacter('user-1', 'char-1');

    expect(result.xpEarned).toBe(0);
    expect(result.coinsEarned).toBe(0);
    expect(result.rewardBreakdown).toEqual([]);
  });

  it('sums the ledger in the database rather than pulling every row', async () => {
    await service.forCharacter('user-1', 'char-1');

    expect(prisma.rewardEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['category'],
        _sum: { xp: true, coins: true },
      }),
    );
  });

  it("throws NotFoundException for a character the caller doesn't own", async () => {
    prisma.character.findFirst.mockResolvedValue(null);

    await expect(
      service.forCharacter('user-1', 'someone-elses'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.quest.findMany).not.toHaveBeenCalled();
  });
});
