import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestStatus } from '../generated/prisma/enums';
import {
  FIRST_BRAVE_STEP_COIN_REWARD,
  FIRST_BRAVE_STEP_XP_REWARD,
  MAX_CONSTRUCTION_STAGE,
  QUEST_COIN_REWARD,
  QUEST_XP_REWARD,
  QuestService,
  SPLIT_COIN_REWARD,
  SPLIT_XP_REWARD,
  TODAYS_THREE_BONUS_COIN_REWARD,
  TODAYS_THREE_BONUS_XP_REWARD,
  TODAYS_THREE_MAX,
} from './quest.service';

function buildPrismaMock() {
  return {
    character: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    quest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    rewardEntry: { create: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
  };
}

// firstBraveStepDay defaults to "today" — already claimed — so pre-existing
// complete() tests that don't care about the daily bonus aren't affected by
// it firing; tests that DO want to exercise the bonus override this.
function buildCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'char-1',
    userId: 'user-1',
    name: 'Ember Scout',
    createdAt: new Date(),
    updatedAt: new Date(),
    hasArrivedAtCamp: true,
    campConstructionStage: 0,
    xp: 0,
    coins: 0,
    firstBraveStepDay: new Date(),
    ...overrides,
  };
}

function buildQuest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quest-1',
    characterId: 'char-1',
    title: 'Answer three emails',
    status: QuestStatus.OPEN,
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

describe('QuestService', () => {
  let service: QuestService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new QuestService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a quest for an owned character', async () => {
      prisma.character.findFirst.mockResolvedValue(buildCharacter());
      const created = buildQuest();
      prisma.quest.create.mockResolvedValue(created);

      const result = await service.create('user-1', 'char-1', {
        title: 'Answer three emails',
      });

      expect(prisma.character.findFirst).toHaveBeenCalledWith({
        where: { id: 'char-1', userId: 'user-1' },
      });
      expect(prisma.quest.create).toHaveBeenCalledWith({
        data: { characterId: 'char-1', title: 'Answer three emails' },
      });
      expect(result).toEqual(created);
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'char-1', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.quest.create).not.toHaveBeenCalled();
    });
  });

  describe('listForCharacter', () => {
    it('returns quests for an owned character, oldest first', async () => {
      prisma.character.findFirst.mockResolvedValue(buildCharacter());
      const quests = [buildQuest()];
      prisma.quest.findMany.mockResolvedValue(quests);

      const result = await service.listForCharacter('user-1', 'char-1');

      expect(prisma.quest.findMany).toHaveBeenCalledWith({
        where: { characterId: 'char-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(quests);
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(
        service.listForCharacter('user-1', 'char-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('start', () => {
    it('moves an open quest to in progress', async () => {
      const quest = buildQuest({ character: buildCharacter() });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const started = buildQuest({ status: QuestStatus.IN_PROGRESS });
      prisma.quest.update.mockResolvedValue(started);

      const result = await service.start('user-1', 'quest-1');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: { status: QuestStatus.IN_PROGRESS },
      });
      expect(result).toEqual(started);
    });

    it('is a no-op for an already-in-progress quest', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.IN_PROGRESS, character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.start('user-1', 'quest-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result.status).toBe(QuestStatus.IN_PROGRESS);
    });

    it('is a no-op for a resolved quest', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.COMPLETED, character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.start('user-1', 'quest-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result.status).toBe(QuestStatus.COMPLETED);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.start('user-1', 'quest-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('continue', () => {
    it('moves an open quest to in progress and stamps lastContinuedAt', async () => {
      const quest = buildQuest({ character: buildCharacter() });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const continued = buildQuest({
        status: QuestStatus.IN_PROGRESS,
        lastContinuedAt: new Date(),
      });
      prisma.quest.update.mockResolvedValue(continued);

      const result = await service.continue('user-1', 'quest-1');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: {
          status: QuestStatus.IN_PROGRESS,
          lastContinuedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(continued);
    });

    it('stamps lastContinuedAt again on an already-in-progress quest (repeated continues are meaningful)', async () => {
      const quest = buildQuest({
        status: QuestStatus.IN_PROGRESS,
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const continued = buildQuest({
        status: QuestStatus.IN_PROGRESS,
        lastContinuedAt: new Date(),
      });
      prisma.quest.update.mockResolvedValue(continued);

      await service.continue('user-1', 'quest-1');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: {
          status: QuestStatus.IN_PROGRESS,
          lastContinuedAt: expect.any(Date),
        },
      });
    });

    it('is a no-op for a resolved quest', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.COMPLETED, character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.continue('user-1', 'quest-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result.status).toBe(QuestStatus.COMPLETED);
    });

    it('is a no-op for a retreated quest', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.RETREATED, character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.continue('user-1', 'quest-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result.status).toBe(QuestStatus.RETREATED);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.continue('user-1', 'quest-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not re-stamp when the idempotency key matches the last processed call (duplicate retry)', async () => {
      const quest = buildQuest({
        status: QuestStatus.IN_PROGRESS,
        lastIdempotencyKey: 'key-1',
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.continue('user-1', 'quest-1', 'key-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result).toEqual(quest);
    });

    it('re-stamps when a fresh idempotency key arrives (a genuine second continue, not a retry)', async () => {
      const quest = buildQuest({
        status: QuestStatus.IN_PROGRESS,
        lastIdempotencyKey: 'key-1',
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const continued = buildQuest({
        status: QuestStatus.IN_PROGRESS,
        lastContinuedAt: new Date(),
      });
      prisma.quest.update.mockResolvedValue(continued);

      await service.continue('user-1', 'quest-1', 'key-2');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: {
          status: QuestStatus.IN_PROGRESS,
          lastContinuedAt: expect.any(Date),
          lastIdempotencyKey: 'key-2',
        },
      });
    });
  });

  describe('complete', () => {
    it('completes an open quest, advances the construction stage, and grants xp/coins atomically', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const completedQuest = buildQuest({
        status: QuestStatus.COMPLETED,
        completedAt: new Date(),
      });
      const updatedCharacter = buildCharacter({
        campConstructionStage: 2,
        xp: QUEST_XP_REWARD,
        coins: QUEST_COIN_REWARD,
      });
      prisma.$transaction.mockResolvedValue([completedQuest, updatedCharacter]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.quest.findFirst).toHaveBeenCalledWith({
        where: { id: 'quest-1', character: { userId: 'user-1' } },
        include: { character: true },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: {
          status: QuestStatus.COMPLETED,
          completedAt: expect.any(Date),
          resolvedAt: expect.any(Date),
          lastIdempotencyKey: undefined,
        },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          campConstructionStage: 2,
          xp: { increment: QUEST_XP_REWARD },
          coins: { increment: QUEST_COIN_REWARD },
        },
      });
      expect(result).toEqual({
        quest: completedQuest,
        character: updatedCharacter,
        firstBraveStepBonusGranted: false,
        todaysThreeBonusGranted: false,
      });
    });

    it('completes an in-progress quest the same as an open one', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const quest = buildQuest({ status: QuestStatus.IN_PROGRESS, character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const completedQuest = buildQuest({
        status: QuestStatus.COMPLETED,
        completedAt: new Date(),
      });
      const updatedCharacter = buildCharacter({
        campConstructionStage: 2,
        xp: QUEST_XP_REWARD,
        coins: QUEST_COIN_REWARD,
      });
      prisma.$transaction.mockResolvedValue([completedQuest, updatedCharacter]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        quest: completedQuest,
        character: updatedCharacter,
        firstBraveStepBonusGranted: false,
        todaysThreeBonusGranted: false,
      });
    });

    it('caps the construction stage at MAX_CONSTRUCTION_STAGE', async () => {
      const character = buildCharacter({
        campConstructionStage: MAX_CONSTRUCTION_STAGE,
      });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.COMPLETED }),
        character,
      ]);

      await service.complete('user-1', 'quest-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          campConstructionStage: MAX_CONSTRUCTION_STAGE,
          xp: { increment: QUEST_XP_REWARD },
          coins: { increment: QUEST_COIN_REWARD },
        },
      });
    });

    it('does not grant a reward again for an already-completed quest', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const expectedQuest = buildQuest({ status: QuestStatus.COMPLETED });
      prisma.quest.findFirst.mockResolvedValue({ ...expectedQuest, character });

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({
        quest: expectedQuest,
        character,
        firstBraveStepBonusGranted: false,
        todaysThreeBonusGranted: false,
      });
    });

    it('does not grant a reward for a retreated quest', async () => {
      const character = buildCharacter();
      const expectedQuest = buildQuest({ status: QuestStatus.RETREATED });
      prisma.quest.findFirst.mockResolvedValue({ ...expectedQuest, character });

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({
        quest: expectedQuest,
        character,
        firstBraveStepBonusGranted: false,
        todaysThreeBonusGranted: false,
      });
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.complete('user-1', 'quest-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not grant a reward again when the idempotency key matches the last processed call', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const quest = buildQuest({ lastIdempotencyKey: 'key-1', character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.complete('user-1', 'quest-1', 'key-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      const { character: resultCharacter, ...rest } = quest;
      expect(result).toEqual({
        quest: rest,
        character: resultCharacter,
        firstBraveStepBonusGranted: false,
        todaysThreeBonusGranted: false,
      });
    });

    it('grants the First Brave Step bonus on the first completion of the day', async () => {
      const character = buildCharacter({
        campConstructionStage: 1,
        firstBraveStepDay: null,
      });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const completedQuest = buildQuest({
        status: QuestStatus.COMPLETED,
        completedAt: new Date(),
      });
      const updatedCharacter = buildCharacter({
        campConstructionStage: 2,
        xp: QUEST_XP_REWARD + FIRST_BRAVE_STEP_XP_REWARD,
        coins: QUEST_COIN_REWARD + FIRST_BRAVE_STEP_COIN_REWARD,
      });
      prisma.$transaction.mockResolvedValue([completedQuest, updatedCharacter]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          campConstructionStage: 2,
          xp: { increment: QUEST_XP_REWARD + FIRST_BRAVE_STEP_XP_REWARD },
          coins: {
            increment: QUEST_COIN_REWARD + FIRST_BRAVE_STEP_COIN_REWARD,
          },
          firstBraveStepDay: expect.any(Date),
        },
      });
      expect(result.firstBraveStepBonusGranted).toBe(true);
      expect(result.todaysThreeBonusGranted).toBe(false);
      // One row per category, not one merged row — the Chronicle reports
      // where a period's XP came from, which a merged row couldn't answer.
      expect(prisma.rewardEntry.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            category: 'QUEST',
            xp: QUEST_XP_REWARD,
            coins: QUEST_COIN_REWARD,
          }),
          expect.objectContaining({
            category: 'FIRST_BRAVE_STEP',
            xp: FIRST_BRAVE_STEP_XP_REWARD,
            coins: FIRST_BRAVE_STEP_COIN_REWARD,
          }),
        ],
      });
    });

    it('writes only a QUEST ledger entry when no daily bonus applies', async () => {
      const character = buildCharacter({ firstBraveStepDay: new Date() });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.COMPLETED }),
        character,
        {},
      ]);

      await service.complete('user-1', 'quest-1');

      const entries = prisma.rewardEntry.createMany.mock.calls[0][0].data;
      expect(entries).toHaveLength(1);
      expect(entries[0].category).toBe('QUEST');
    });

    it('writes three ledger entries when both daily bonuses stack', async () => {
      const character = buildCharacter({ firstBraveStepDay: null });
      const quest = buildQuest({ character, todaysThreeDay: new Date() });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.COMPLETED }),
        character,
        {},
      ]);

      await service.complete('user-1', 'quest-1');

      const entries = prisma.rewardEntry.createMany.mock.calls[0][0].data;
      expect(entries.map((e: { category: string }) => e.category)).toEqual([
        'QUEST',
        'FIRST_BRAVE_STEP',
        'TODAYS_THREE',
      ]);
      // The ledger must sum to exactly what the balance changed by.
      const totalXp = entries.reduce(
        (sum: number, e: { xp: number }) => sum + e.xp,
        0,
      );
      expect(totalXp).toBe(
        QUEST_XP_REWARD +
          FIRST_BRAVE_STEP_XP_REWARD +
          TODAYS_THREE_BONUS_XP_REWARD,
      );
    });

    it('writes no ledger entry when the completion is a duplicate no-op', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.COMPLETED, character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      await service.complete('user-1', 'quest-1');

      expect(prisma.rewardEntry.createMany).not.toHaveBeenCalled();
    });

    it('does not grant the First Brave Step bonus twice on the same UTC day', async () => {
      const character = buildCharacter({ firstBraveStepDay: new Date() });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.COMPLETED }),
        character,
      ]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          campConstructionStage: 1,
          xp: { increment: QUEST_XP_REWARD },
          coins: { increment: QUEST_COIN_REWARD },
          firstBraveStepDay: undefined,
        },
      });
      expect(result.firstBraveStepBonusGranted).toBe(false);
    });

    it("grants the Today's Three bonus when the completed quest was designated for today", async () => {
      const character = buildCharacter();
      const quest = buildQuest({ character, todaysThreeDay: new Date() });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.COMPLETED }),
        character,
      ]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          campConstructionStage: 1,
          xp: { increment: QUEST_XP_REWARD + TODAYS_THREE_BONUS_XP_REWARD },
          coins: {
            increment: QUEST_COIN_REWARD + TODAYS_THREE_BONUS_COIN_REWARD,
          },
          firstBraveStepDay: undefined,
        },
      });
      expect(result.todaysThreeBonusGranted).toBe(true);
    });

    it("does not grant the Today's Three bonus for a quest designated on a previous day", async () => {
      const character = buildCharacter();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const quest = buildQuest({ character, todaysThreeDay: yesterday });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.COMPLETED }),
        character,
      ]);

      const result = await service.complete('user-1', 'quest-1');

      expect(result.todaysThreeBonusGranted).toBe(false);
    });

    it("stacks the First Brave Step and Today's Three bonuses together", async () => {
      const character = buildCharacter({ firstBraveStepDay: null });
      const quest = buildQuest({ character, todaysThreeDay: new Date() });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.COMPLETED }),
        character,
      ]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          campConstructionStage: 1,
          xp: {
            increment:
              QUEST_XP_REWARD +
              FIRST_BRAVE_STEP_XP_REWARD +
              TODAYS_THREE_BONUS_XP_REWARD,
          },
          coins: {
            increment:
              QUEST_COIN_REWARD +
              FIRST_BRAVE_STEP_COIN_REWARD +
              TODAYS_THREE_BONUS_COIN_REWARD,
          },
          firstBraveStepDay: expect.any(Date),
        },
      });
      expect(result.firstBraveStepBonusGranted).toBe(true);
      expect(result.todaysThreeBonusGranted).toBe(true);
    });
  });

  describe('retreat', () => {
    it('marks an open quest retreated with no reward', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const retreatedQuest = buildQuest({ status: QuestStatus.RETREATED });
      prisma.quest.update.mockResolvedValue(retreatedQuest);

      const result = await service.retreat('user-1', 'quest-1');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: {
          status: QuestStatus.RETREATED,
          resolvedAt: expect.any(Date),
          lastIdempotencyKey: undefined,
        },
      });
      expect(prisma.character.update).not.toHaveBeenCalled();
      expect(result).toEqual(retreatedQuest);
    });

    it('retreats an in-progress quest the same as an open one', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.IN_PROGRESS, character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const retreatedQuest = buildQuest({ status: QuestStatus.RETREATED });
      prisma.quest.update.mockResolvedValue(retreatedQuest);

      const result = await service.retreat('user-1', 'quest-1');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: {
          status: QuestStatus.RETREATED,
          resolvedAt: expect.any(Date),
          lastIdempotencyKey: undefined,
        },
      });
      expect(result).toEqual(retreatedQuest);
    });

    it('does not re-retreat an already-completed quest', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.COMPLETED, character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.retreat('user-1', 'quest-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result.status).toBe(QuestStatus.COMPLETED);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.retreat('user-1', 'quest-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not re-retreat when the idempotency key matches the last processed call', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ lastIdempotencyKey: 'key-1', character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.retreat('user-1', 'quest-1', 'key-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result).toEqual(quest);
    });
  });

  describe('split', () => {
    it('splits an open quest for half reward, with no construction-stage change', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const splitQuest = buildQuest({ status: QuestStatus.SPLIT });
      const updatedCharacter = buildCharacter({
        campConstructionStage: 1,
        xp: SPLIT_XP_REWARD,
        coins: SPLIT_COIN_REWARD,
      });
      prisma.$transaction.mockResolvedValue([splitQuest, updatedCharacter]);

      const result = await service.split('user-1', 'quest-1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: {
          status: QuestStatus.SPLIT,
          resolvedAt: expect.any(Date),
          lastIdempotencyKey: undefined,
        },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          xp: { increment: SPLIT_XP_REWARD },
          coins: { increment: SPLIT_COIN_REWARD },
        },
      });
      expect(result).toEqual({
        quest: splitQuest,
        character: updatedCharacter,
      });
    });

    it('splits an in-progress quest the same as an open one', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ status: QuestStatus.IN_PROGRESS, character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([
        buildQuest({ status: QuestStatus.SPLIT }),
        character,
      ]);

      await service.split('user-1', 'quest-1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('does not grant a reward again for an already-split quest', async () => {
      const character = buildCharacter();
      const expectedQuest = buildQuest({ status: QuestStatus.SPLIT });
      prisma.quest.findFirst.mockResolvedValue({ ...expectedQuest, character });

      const result = await service.split('user-1', 'quest-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ quest: expectedQuest, character });
    });

    it('does not grant a reward for an already-completed or retreated quest', async () => {
      const character = buildCharacter();
      const expectedQuest = buildQuest({ status: QuestStatus.COMPLETED });
      prisma.quest.findFirst.mockResolvedValue({ ...expectedQuest, character });

      const result = await service.split('user-1', 'quest-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ quest: expectedQuest, character });
    });

    it('does not re-split when the idempotency key matches the last processed call', async () => {
      const character = buildCharacter();
      const quest = buildQuest({ lastIdempotencyKey: 'key-1', character });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.split('user-1', 'quest-1', 'key-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      const { character: resultCharacter, ...rest } = quest;
      expect(result).toEqual({ quest: rest, character: resultCharacter });
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.split('user-1', 'quest-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('designateTodaysThree', () => {
    it('designates an open quest for today when under the cap', async () => {
      const quest = buildQuest({ character: buildCharacter() });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.quest.count.mockResolvedValue(0);
      const designated = buildQuest({ todaysThreeDay: new Date() });
      prisma.quest.update.mockResolvedValue(designated);

      const result = await service.designateTodaysThree('user-1', 'quest-1');

      expect(prisma.quest.count).toHaveBeenCalledWith({
        where: { characterId: 'char-1', todaysThreeDay: expect.any(Date) },
      });
      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: { todaysThreeDay: expect.any(Date) },
      });
      expect(result).toEqual(designated);
    });

    it('is idempotent when the quest is already designated today', async () => {
      const quest = buildQuest({
        todaysThreeDay: new Date(),
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.designateTodaysThree('user-1', 'quest-1');

      expect(prisma.quest.count).not.toHaveBeenCalled();
      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result).toEqual(quest);
    });

    it('re-designates a quest whose designation lapsed on a previous day', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const quest = buildQuest({
        todaysThreeDay: yesterday,
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.quest.count.mockResolvedValue(0);
      prisma.quest.update.mockResolvedValue(
        buildQuest({ todaysThreeDay: new Date() }),
      );

      await service.designateTodaysThree('user-1', 'quest-1');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: { todaysThreeDay: expect.any(Date) },
      });
    });

    it('rejects designating a resolved quest', async () => {
      const quest = buildQuest({
        status: QuestStatus.COMPLETED,
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);

      await expect(
        service.designateTodaysThree('user-1', 'quest-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.quest.update).not.toHaveBeenCalled();
    });

    it(`rejects once ${TODAYS_THREE_MAX} quests are already designated for today`, async () => {
      const quest = buildQuest({ character: buildCharacter() });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.quest.count.mockResolvedValue(TODAYS_THREE_MAX);

      await expect(
        service.designateTodaysThree('user-1', 'quest-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.quest.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(
        service.designateTodaysThree('user-1', 'quest-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('undesignateTodaysThree', () => {
    it("removes today's designation", async () => {
      const quest = buildQuest({
        todaysThreeDay: new Date(),
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const undesignated = buildQuest({ todaysThreeDay: null });
      prisma.quest.update.mockResolvedValue(undesignated);

      const result = await service.undesignateTodaysThree('user-1', 'quest-1');

      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: { todaysThreeDay: null },
      });
      expect(result).toEqual(undesignated);
    });

    it('is an idempotent no-op when the quest was not designated today', async () => {
      const quest = buildQuest({
        todaysThreeDay: null,
        character: buildCharacter(),
      });
      prisma.quest.findFirst.mockResolvedValue(quest);

      const result = await service.undesignateTodaysThree('user-1', 'quest-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(result).toEqual(quest);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(
        service.undesignateTodaysThree('user-1', 'quest-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
