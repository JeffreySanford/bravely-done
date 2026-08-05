import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncounterStatus } from '../generated/prisma/enums';
import { COURAGE_XP_REWARD, EncounterService } from './encounter.service';

function buildPrismaMock() {
  return {
    quest: {
      findFirst: jest.fn(),
    },
    character: {
      update: jest.fn(),
    },
    encounter: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
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
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

function buildEncounter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'enc-1',
    questId: 'quest-1',
    title: 'Draft the reply',
    status: EncounterStatus.OPEN,
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

describe('EncounterService', () => {
  let service: EncounterService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new EncounterService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates an encounter for an owned quest', async () => {
      prisma.quest.findFirst.mockResolvedValue({ ...buildQuest(), character: buildCharacter() });
      const created = buildEncounter();
      prisma.encounter.create.mockResolvedValue(created);

      const result = await service.create('user-1', 'quest-1', { title: 'Draft the reply' });

      expect(prisma.encounter.create).toHaveBeenCalledWith({
        data: { questId: 'quest-1', title: 'Draft the reply' },
      });
      expect(result).toEqual(created);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.create('user-1', 'quest-1', { title: 'x' })).rejects.toThrow(NotFoundException);
      expect(prisma.encounter.create).not.toHaveBeenCalled();
    });
  });

  describe('listForQuest', () => {
    it('returns encounters for an owned quest, oldest first', async () => {
      prisma.quest.findFirst.mockResolvedValue({ ...buildQuest(), character: buildCharacter() });
      const encounters = [buildEncounter()];
      prisma.encounter.findMany.mockResolvedValue(encounters);

      const result = await service.listForQuest('user-1', 'quest-1');

      expect(prisma.encounter.findMany).toHaveBeenCalledWith({
        where: { questId: 'quest-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(encounters);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.listForQuest('user-1', 'quest-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('completes an open encounter and grants Courage XP atomically', async () => {
      const encounter = { ...buildEncounter(), quest: { ...buildQuest(), character: buildCharacter() } };
      prisma.encounter.findFirst.mockResolvedValue(encounter);
      const completedEncounter = buildEncounter({ status: EncounterStatus.COMPLETED, completedAt: new Date() });
      const updatedCharacter = buildCharacter({ xp: COURAGE_XP_REWARD });
      prisma.$transaction.mockResolvedValue([completedEncounter, updatedCharacter]);

      const result = await service.complete('user-1', 'enc-1');

      expect(prisma.encounter.update).toHaveBeenCalledWith({
        where: { id: 'enc-1' },
        data: { status: EncounterStatus.COMPLETED, completedAt: expect.any(Date) },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { xp: { increment: COURAGE_XP_REWARD } },
      });
      expect(result).toEqual({ encounter: completedEncounter, character: updatedCharacter });
    });

    it('does not grant a reward again for an already-completed encounter', async () => {
      const character = buildCharacter({ xp: COURAGE_XP_REWARD });
      const expectedEncounter = buildEncounter({ status: EncounterStatus.COMPLETED });
      prisma.encounter.findFirst.mockResolvedValue({
        ...expectedEncounter,
        quest: { ...buildQuest(), character },
      });

      const result = await service.complete('user-1', 'enc-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ encounter: expectedEncounter, character });
    });

    it('throws NotFoundException when the encounter is not owned by the user', async () => {
      prisma.encounter.findFirst.mockResolvedValue(null);

      await expect(service.complete('user-1', 'enc-1')).rejects.toThrow(NotFoundException);
    });
  });
});
