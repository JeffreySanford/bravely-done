import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestStatus } from '../generated/prisma/enums';
import { MAX_CONSTRUCTION_STAGE, QuestService } from './quest.service';

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

  describe('complete', () => {
    it('completes an open quest and advances the construction stage', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      const completedQuest = buildQuest({ status: QuestStatus.COMPLETED, completedAt: new Date() });
      prisma.quest.update.mockResolvedValue(completedQuest);
      const updatedCharacter = buildCharacter({ campConstructionStage: 2 });
      prisma.character.update.mockResolvedValue(updatedCharacter);

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.quest.findFirst).toHaveBeenCalledWith({
        where: { id: 'quest-1', character: { userId: 'user-1' } },
        include: { character: true },
      });
      expect(prisma.quest.update).toHaveBeenCalledWith({
        where: { id: 'quest-1' },
        data: { status: QuestStatus.COMPLETED, completedAt: expect.any(Date) },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { campConstructionStage: 2 },
      });
      expect(result).toEqual({ quest: completedQuest, character: updatedCharacter });
    });

    it('caps the construction stage at MAX_CONSTRUCTION_STAGE', async () => {
      const character = buildCharacter({ campConstructionStage: MAX_CONSTRUCTION_STAGE });
      const quest = buildQuest({ character });
      prisma.quest.findFirst.mockResolvedValue(quest);
      prisma.quest.update.mockResolvedValue(buildQuest({ status: QuestStatus.COMPLETED }));
      prisma.character.update.mockResolvedValue(character);

      await service.complete('user-1', 'quest-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { campConstructionStage: MAX_CONSTRUCTION_STAGE },
      });
    });

    it('does not advance the stage again for an already-completed quest', async () => {
      const character = buildCharacter({ campConstructionStage: 1 });
      const expectedQuest = buildQuest({ status: QuestStatus.COMPLETED });
      prisma.quest.findFirst.mockResolvedValue({ ...expectedQuest, character });

      const result = await service.complete('user-1', 'quest-1');

      expect(prisma.quest.update).not.toHaveBeenCalled();
      expect(prisma.character.update).not.toHaveBeenCalled();
      expect(result).toEqual({ quest: expectedQuest, character });
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.complete('user-1', 'quest-1')).rejects.toThrow(NotFoundException);
    });
  });
});
