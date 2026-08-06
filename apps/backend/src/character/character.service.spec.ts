import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CharacterService,
  WORKBENCH_MAX_LEVEL,
  WORKBENCH_UPGRADE_COSTS,
  gatheringYield,
} from './character.service';

function buildPrismaMock() {
  return {
    character: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    rewardEntry: { create: jest.fn(), createMany: jest.fn() },
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
    hasArrivedAtCamp: false,
    campConstructionStage: 0,
    firewoodCount: 0,
    forageCount: 0,
    xp: 0,
    coins: 0,
    workbenchLevel: 0,
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

      expect(prisma.character.findFirst).toHaveBeenCalledWith({
        where: { id: 'char-1', userId: 'user-1' },
      });
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

      await expect(service.arrive('user-1', 'char-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('chopTree', () => {
    it('atomically increments firewoodCount for an owned character', async () => {
      prisma.character.findFirst.mockResolvedValue(buildCharacter());
      const updated = buildCharacter({ firewoodCount: 1 });
      prisma.character.update.mockResolvedValue(updated);

      const result = await service.chopTree('user-1', 'char-1');

      expect(prisma.character.findFirst).toHaveBeenCalledWith({
        where: { id: 'char-1', userId: 'user-1' },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { firewoodCount: { increment: 1 } },
      });
      expect(result).toEqual(updated);
    });

    it('grants more firewood per chop as the workbench levels up', async () => {
      prisma.character.findFirst.mockResolvedValue(
        buildCharacter({ workbenchLevel: 2 }),
      );
      prisma.character.update.mockResolvedValue(
        buildCharacter({ workbenchLevel: 2, firewoodCount: 3 }),
      );

      await service.chopTree('user-1', 'char-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { firewoodCount: { increment: 3 } },
      });
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(service.chopTree('user-1', 'char-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.character.update).not.toHaveBeenCalled();
    });
  });

  describe('forage', () => {
    it('atomically increments forageCount for an owned character', async () => {
      prisma.character.findFirst.mockResolvedValue(buildCharacter());
      const updated = buildCharacter({ forageCount: 1 });
      prisma.character.update.mockResolvedValue(updated);

      const result = await service.forage('user-1', 'char-1');

      expect(prisma.character.findFirst).toHaveBeenCalledWith({
        where: { id: 'char-1', userId: 'user-1' },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { forageCount: { increment: 1 } },
      });
      expect(result).toEqual(updated);
    });

    it('grants more forage per harvest as the workbench levels up', async () => {
      prisma.character.findFirst.mockResolvedValue(
        buildCharacter({ workbenchLevel: WORKBENCH_MAX_LEVEL }),
      );
      prisma.character.update.mockResolvedValue(
        buildCharacter({ workbenchLevel: WORKBENCH_MAX_LEVEL, forageCount: 4 }),
      );

      await service.forage('user-1', 'char-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { forageCount: { increment: 4 } },
      });
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(service.forage('user-1', 'char-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.character.update).not.toHaveBeenCalled();
    });
  });

  describe('gatheringYield', () => {
    it('is one more unit per workbench level', () => {
      expect(gatheringYield(0)).toBe(1);
      expect(gatheringYield(1)).toBe(2);
      expect(gatheringYield(2)).toBe(3);
      expect(gatheringYield(WORKBENCH_MAX_LEVEL)).toBe(4);
    });
  });

  describe('upgradeWorkbench', () => {
    it('spends coins and increments workbenchLevel when affordable', async () => {
      const cost = WORKBENCH_UPGRADE_COSTS[0];
      prisma.character.findFirst.mockResolvedValue(
        buildCharacter({ coins: cost, workbenchLevel: 0 }),
      );
      const updated = buildCharacter({ coins: 0, workbenchLevel: 1 });
      prisma.$transaction.mockResolvedValue([updated, {}]);

      const result = await service.upgradeWorkbench('user-1', 'char-1');

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { coins: { decrement: cost }, workbenchLevel: { increment: 1 } },
      });
      expect(result).toEqual(updated);
    });

    it('records the spend as a negative-coin ledger entry, so the ledger reconciles', async () => {
      const cost = WORKBENCH_UPGRADE_COSTS[0];
      prisma.character.findFirst.mockResolvedValue(
        buildCharacter({ coins: cost, workbenchLevel: 0 }),
      );
      prisma.$transaction.mockResolvedValue([
        buildCharacter({ coins: 0, workbenchLevel: 1 }),
        {},
      ]);

      await service.upgradeWorkbench('user-1', 'char-1');

      expect(prisma.rewardEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          characterId: 'char-1',
          category: 'WORKBENCH_UPGRADE',
          coins: -cost,
          xp: 0,
        }),
      });
    });

    it('writes no ledger entry when the upgrade is rejected', async () => {
      const cost = WORKBENCH_UPGRADE_COSTS[0];
      prisma.character.findFirst.mockResolvedValue(
        buildCharacter({ coins: cost - 1, workbenchLevel: 0 }),
      );

      await expect(
        service.upgradeWorkbench('user-1', 'char-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.rewardEntry.create).not.toHaveBeenCalled();
    });

    it('writes no ledger entry when already at max level', async () => {
      prisma.character.findFirst.mockResolvedValue(
        buildCharacter({ coins: 999, workbenchLevel: WORKBENCH_MAX_LEVEL }),
      );

      await service.upgradeWorkbench('user-1', 'char-1');

      expect(prisma.rewardEntry.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the character cannot afford the next level', async () => {
      const cost = WORKBENCH_UPGRADE_COSTS[0];
      prisma.character.findFirst.mockResolvedValue(
        buildCharacter({ coins: cost - 1, workbenchLevel: 0 }),
      );

      await expect(
        service.upgradeWorkbench('user-1', 'char-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.character.update).not.toHaveBeenCalled();
    });

    it('does not upgrade again once already at WORKBENCH_MAX_LEVEL', async () => {
      const maxed = buildCharacter({
        coins: 1000,
        workbenchLevel: WORKBENCH_MAX_LEVEL,
      });
      prisma.character.findFirst.mockResolvedValue(maxed);

      const result = await service.upgradeWorkbench('user-1', 'char-1');

      expect(prisma.character.update).not.toHaveBeenCalled();
      expect(result).toEqual(maxed);
    });

    it('throws NotFoundException when the character is not owned by the user', async () => {
      prisma.character.findFirst.mockResolvedValue(null);

      await expect(
        service.upgradeWorkbench('user-1', 'char-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
