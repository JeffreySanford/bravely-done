import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestStatus, SprintStatus } from '../generated/prisma/enums';
import { FOCUS_XP_REWARD, SprintService } from './sprint.service';

function buildPrismaMock() {
  return {
    quest: {
      findFirst: jest.fn(),
    },
    character: {
      update: jest.fn(),
    },
    sprint: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
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
    status: QuestStatus.IN_PROGRESS,
    createdAt: new Date(),
    completedAt: null,
    ...overrides,
  };
}

function buildSprint(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sprint-1',
    questId: 'quest-1',
    targetSeconds: 900,
    startedAt: new Date(),
    pausedAt: null,
    pausedSeconds: 0,
    status: SprintStatus.ACTIVE,
    completedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('SprintService', () => {
  let service: SprintService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new SprintService(prisma as unknown as PrismaService);
  });

  describe('start', () => {
    it('creates a sprint for an in-progress quest', async () => {
      prisma.quest.findFirst.mockResolvedValue({
        ...buildQuest(),
        character: buildCharacter(),
      });
      prisma.sprint.findFirst.mockResolvedValue(null);
      const created = buildSprint();
      prisma.sprint.create.mockResolvedValue(created);

      const result = await service.start('user-1', 'quest-1', {
        targetSeconds: 900,
      });

      expect(prisma.sprint.create).toHaveBeenCalledWith({
        data: { questId: 'quest-1', targetSeconds: 900 },
      });
      expect(result).toEqual(created);
    });

    it('throws BadRequestException when the quest is not in progress', async () => {
      prisma.quest.findFirst.mockResolvedValue({
        ...buildQuest({ status: QuestStatus.OPEN }),
        character: buildCharacter(),
      });

      await expect(
        service.start('user-1', 'quest-1', { targetSeconds: 900 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.sprint.create).not.toHaveBeenCalled();
    });

    it('returns the existing active sprint instead of creating a second one', async () => {
      prisma.quest.findFirst.mockResolvedValue({
        ...buildQuest(),
        character: buildCharacter(),
      });
      const existing = buildSprint();
      prisma.sprint.findFirst.mockResolvedValue(existing);

      const result = await service.start('user-1', 'quest-1', {
        targetSeconds: 900,
      });

      expect(prisma.sprint.create).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(
        service.start('user-1', 'quest-1', { targetSeconds: 900 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listForQuest', () => {
    it('returns sprints for an owned quest, oldest first', async () => {
      prisma.quest.findFirst.mockResolvedValue({
        ...buildQuest(),
        character: buildCharacter(),
      });
      const sprints = [buildSprint()];
      prisma.sprint.findMany.mockResolvedValue(sprints);

      const result = await service.listForQuest('user-1', 'quest-1');

      expect(prisma.sprint.findMany).toHaveBeenCalledWith({
        where: { questId: 'quest-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(sprints);
    });

    it('throws NotFoundException when the quest is not owned by the user', async () => {
      prisma.quest.findFirst.mockResolvedValue(null);

      await expect(service.listForQuest('user-1', 'quest-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('pause', () => {
    it('pauses an active sprint', async () => {
      const sprint = {
        ...buildSprint(),
        quest: { ...buildQuest(), character: buildCharacter() },
      };
      prisma.sprint.findFirst.mockResolvedValue(sprint);
      const paused = buildSprint({
        status: SprintStatus.PAUSED,
        pausedAt: new Date(),
      });
      prisma.sprint.update.mockResolvedValue(paused);

      const result = await service.pause('user-1', 'sprint-1');

      expect(prisma.sprint.update).toHaveBeenCalledWith({
        where: { id: 'sprint-1' },
        data: { status: SprintStatus.PAUSED, pausedAt: expect.any(Date) },
      });
      expect(result).toEqual(paused);
    });

    it('is a no-op for an already-paused sprint', async () => {
      const sprint = {
        ...buildSprint({ status: SprintStatus.PAUSED, pausedAt: new Date() }),
        quest: { ...buildQuest(), character: buildCharacter() },
      };
      prisma.sprint.findFirst.mockResolvedValue(sprint);

      const result = await service.pause('user-1', 'sprint-1');

      expect(prisma.sprint.update).not.toHaveBeenCalled();
      expect(result.status).toBe(SprintStatus.PAUSED);
    });

    it('throws NotFoundException when the sprint is not owned by the user', async () => {
      prisma.sprint.findFirst.mockResolvedValue(null);

      await expect(service.pause('user-1', 'sprint-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resume', () => {
    it('folds the paused interval into pausedSeconds and clears pausedAt', async () => {
      const pausedAt = new Date(Date.now() - 30_000);
      const sprint = {
        ...buildSprint({
          status: SprintStatus.PAUSED,
          pausedAt,
          pausedSeconds: 10,
        }),
        quest: { ...buildQuest(), character: buildCharacter() },
      };
      prisma.sprint.findFirst.mockResolvedValue(sprint);
      const resumed = buildSprint({ status: SprintStatus.ACTIVE });
      prisma.sprint.update.mockResolvedValue(resumed);

      const result = await service.resume('user-1', 'sprint-1');

      expect(prisma.sprint.update).toHaveBeenCalledWith({
        where: { id: 'sprint-1' },
        data: {
          status: SprintStatus.ACTIVE,
          pausedAt: null,
          pausedSeconds: expect.any(Number),
        },
      });
      const call = prisma.sprint.update.mock.calls[0][0];
      expect(call.data.pausedSeconds).toBeGreaterThanOrEqual(40);
      expect(result).toEqual(resumed);
    });

    it('is a no-op for an already-active sprint', async () => {
      const sprint = {
        ...buildSprint(),
        quest: { ...buildQuest(), character: buildCharacter() },
      };
      prisma.sprint.findFirst.mockResolvedValue(sprint);

      const result = await service.resume('user-1', 'sprint-1');

      expect(prisma.sprint.update).not.toHaveBeenCalled();
      expect(result.status).toBe(SprintStatus.ACTIVE);
    });

    it('throws NotFoundException when the sprint is not owned by the user', async () => {
      prisma.sprint.findFirst.mockResolvedValue(null);

      await expect(service.resume('user-1', 'sprint-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('complete', () => {
    it('rejects completion before the target duration has elapsed', async () => {
      const sprint = {
        ...buildSprint({
          startedAt: new Date(Date.now() - 5_000),
          targetSeconds: 900,
        }),
        quest: { ...buildQuest(), character: buildCharacter() },
      };
      prisma.sprint.findFirst.mockResolvedValue(sprint);

      await expect(service.complete('user-1', 'sprint-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('completes and grants Focus XP once the target duration has elapsed', async () => {
      const sprint = {
        ...buildSprint({
          startedAt: new Date(Date.now() - 900_000),
          targetSeconds: 900,
        }),
        quest: { ...buildQuest(), character: buildCharacter() },
      };
      prisma.sprint.findFirst.mockResolvedValue(sprint);
      const completedSprint = buildSprint({
        status: SprintStatus.COMPLETED,
        completedAt: new Date(),
      });
      const updatedCharacter = buildCharacter({ xp: FOCUS_XP_REWARD });
      prisma.$transaction.mockResolvedValue([
        completedSprint,
        updatedCharacter,
      ]);

      const result = await service.complete('user-1', 'sprint-1');

      expect(prisma.sprint.update).toHaveBeenCalledWith({
        where: { id: 'sprint-1' },
        data: { status: SprintStatus.COMPLETED, completedAt: expect.any(Date) },
      });
      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { xp: { increment: FOCUS_XP_REWARD } },
      });
      expect(result).toEqual({
        sprint: completedSprint,
        character: updatedCharacter,
      });
    });

    it('accounts for paused time when computing elapsed active seconds', async () => {
      // 900s (target) of wall-clock time has passed, but 100s of that was
      // spent paused — so only 800s of real active time has elapsed and
      // completion should still be rejected.
      const sprint = {
        ...buildSprint({
          startedAt: new Date(Date.now() - 900_000),
          pausedSeconds: 100,
          targetSeconds: 900,
        }),
        quest: { ...buildQuest(), character: buildCharacter() },
      };
      prisma.sprint.findFirst.mockResolvedValue(sprint);

      await expect(service.complete('user-1', 'sprint-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('does not grant a reward again for an already-completed sprint', async () => {
      const character = buildCharacter({ xp: FOCUS_XP_REWARD });
      const expectedSprint = buildSprint({ status: SprintStatus.COMPLETED });
      prisma.sprint.findFirst.mockResolvedValue({
        ...expectedSprint,
        quest: { ...buildQuest(), character },
      });

      const result = await service.complete('user-1', 'sprint-1');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ sprint: expectedSprint, character });
    });

    it('throws NotFoundException when the sprint is not owned by the user', async () => {
      prisma.sprint.findFirst.mockResolvedValue(null);

      await expect(service.complete('user-1', 'sprint-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
