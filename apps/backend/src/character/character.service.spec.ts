import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CharacterService, MAX_CONSTRUCTION_STAGE } from './character.service';

function buildPrismaMock() {
  return {
    character: {
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
    hasArrivedAtCamp: false,
    campConstructionStage: 0,
    ...overrides,
  };
}

describe('CharacterService', () => {
  let service: CharacterService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new CharacterService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a character owned by the given user', async () => {
      const created = buildCharacter();
      prisma.character.create.mockResolvedValue(created);

      const result = await service.create('user-1', { name: 'Ember Scout' });

      expect(result).toEqual(created);
      expect(prisma.character.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', name: 'Ember Scout' },
      });
    });
  });

  describe('listForUser', () => {
    it('returns characters owned by the given user, oldest first', async () => {
      const characters = [buildCharacter({ name: 'A' })];
      prisma.character.findMany.mockResolvedValue(characters);

      const result = await service.listForUser('user-1');

      expect(result).toEqual(characters);
      expect(prisma.character.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('arrive', () => {
    it('reports firstArrival and sets hasArrivedAtCamp when arriving for the first time', async () => {
      const existing = buildCharacter({ hasArrivedAtCamp: false });
      const updated = buildCharacter({ hasArrivedAtCamp: true });
      prisma.character.findFirst.mockResolvedValue(existing);
      prisma.character.update.mockResolvedValue(updated);

      const result = await service.arrive('user-1', 'char-1');

      expect(prisma.character.findFirst).toHaveBeenCalledWith({ where: { id: 'char-1', userId: 'user-1' } });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { hasArrivedAtCamp: true },
      });
      expect(result).toEqual({ firstArrival: true, character: updated });
    });

    it('reports firstArrival: false and does not update on a repeat arrival', async () => {
      const existing = buildCharacter({ hasArrivedAtCamp: true });
      prisma.character.findFirst.mockResolvedValue(existing);

      const result = await service.arrive('user-1', 'char-1');

      expect(prisma.character.update).not.toHaveBeenCalled();
      expect(result).toEqual({ firstArrival: false, character: existing });
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(service.arrive('user-1', 'char-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('completeMockQuest', () => {
    it('advances the construction stage by one', async () => {
      const existing = buildCharacter({ campConstructionStage: 1 });
      const updated = buildCharacter({ campConstructionStage: 2 });
      prisma.character.findFirst.mockResolvedValue(existing);
      prisma.character.update.mockResolvedValue(updated);

      const result = await service.completeMockQuest('user-1', 'char-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { campConstructionStage: 2 },
      });
      expect(result).toEqual(updated);
    });

    it('caps the construction stage at MAX_CONSTRUCTION_STAGE', async () => {
      const existing = buildCharacter({ campConstructionStage: MAX_CONSTRUCTION_STAGE });
      prisma.character.findFirst.mockResolvedValue(existing);
      prisma.character.update.mockResolvedValue(existing);

      await service.completeMockQuest('user-1', 'char-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { campConstructionStage: MAX_CONSTRUCTION_STAGE },
      });
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(service.completeMockQuest('user-1', 'char-1')).rejects.toThrow(NotFoundException);
    });
  });
});
