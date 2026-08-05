import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestStatus } from '../generated/prisma/enums';
import { MAX_CONSTRUCTION_STAGE, QUEST_COIN_REWARD, QUEST_XP_REWARD, QuestService } from './quest.service';

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
    },
    $transaction: jest.fn(),
  };
}

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

      const result = await service.create('user-1', 'char-1', { title: 'Answer three emails' });

      expect(prisma.character.findFirst).toHaveBeenCalledWith({ where: { id: 'char-1', userId: 'user-1' } });
      expect(prisma.quest.create).toHaveBeenCalledWith({
        data: { characterId: 'char-1', title: 'Answer three emails' },
      });
      expect(result).toEqual(created);
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(service.create('user-1', 'char-1', { title: 'x' })).rejects.toThrow(NotFoundException);
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

      await expect(service.listForCharacter('user-1', 'char-1')).rejects.toThrow(NotFoundException);
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

      await expect(service.start('user-1', 'quest-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('completes an open quest, advances the construction stage, and grants xp/coins atomically', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const completedQuest = buildQuest({ status: QuestStatus.COMPLETED, completedAt: new Date() });
      const updatedCharacter = buildCharacter({ campConstructionStage: 2, xp: QUEST_XP_REWARD, coins: QUEST_COIN_REWARD });
      prisma.$transaction.mockResolvedValue([completedQuest, updatedCharacter]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.quest.findFirst).toHaveBeenCalledWith({
        where: { id: 'quest-1', character: { userId: 'user-1' } },
        include: { character: true },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: { status: QuestStatus.COMPLETED, completedAt: expect.any(Date) },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          campConstructionStage: 2,
          xp: { increment: QUEST_XP_REWARD },
          coins: { increment: QUEST_COIN_REWARD },
        },
      });
      expect(result).toEqual({ quest: completedQuest, character: updatedCharacter });
    });

    it('completes an in-progress quest the same as an open one', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const quest = buildQuest({ status: QuestStatus.IN_PROGRESS, character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const completedQuest = buildQuest({ status: QuestStatus.COMPLETED, completedAt: new Date() });
      const updatedCharacter = buildCharacter({ campConstructionStage: 2, xp: QUEST_XP_REWARD, coins: QUEST_COIN_REWARD });
      prisma.$transaction.mockResolvedValue([completedQuest, updatedCharacter]);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ quest: completedQuest, character: updatedCharacter });
    });

    it('caps the construction stage at MAX_CONSTRUCTION_STAGE', async () => {
      const character = buildCharacter({ campConstructionStage: MAX_CONSTRUCTION_STAGE });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.$transaction.mockResolvedValue([buildQuest({ status: QuestStatus.COMPLETED }), character]);

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
      expect(result).toEqual({ quest: expectedQuest, character });
    });

    it('does not grant a reward for a retreated quest', async () => {
      const character = buildCharacter();
      const expectedQuest = buildQuest({ status: QuestStatus.RETREATED });
      prisma.quest.findFirst.mockResolvedValue({ ...expectedQuest, character });

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ quest: expectedQuest, character });
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.complete('user-1', 'quest-1')).rejects.toThrow(NotFoundException);
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
        data: { status: QuestStatus.RETREATED },
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
        data: { status: QuestStatus.RETREATED },
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

      await expect(service.retreat('user-1', 'quest-1')).rejects.toThrow(NotFoundException);
    });
  });
});
