import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Character,
  Quest,
  QuestStatus,
  RewardCategory,
  Sprint,
  SprintStatus,
} from '../generated/prisma/client';
import { rewardEntryData } from '../reward-ledger/reward-entry';
import { CreateSprintDto } from './dto/create-sprint.dto';

/** A sprint's target duration must be one of these — a bounded set of
 * player-chosen presets rather than an arbitrary value, so there's no
 * "set a 1-second sprint" idle-timer loophole to validate against and no
 * open-ended UI to build for a first slice. */
export const SPRINT_DURATION_PRESETS_SECONDS = [900, 1500, 2700, 3600] as const;

/** Deterministic, flat reward regardless of how long the sprint actually
 * ran past its target — see documentation/product/rewards-retention.md's
 * "reward formulas must resist idle timers" rule. Its own reward category
 * ("Focus XP for completing an honest sprint"), separate from
 * QuestService.QUEST_XP_REWARD, but both add to the same Character.xp
 * counter (see schema.prisma). */
export const FOCUS_XP_REWARD = 15;

type OwnedSprint = Sprint & { quest: Quest & { character: Character } };

@Injectable()
export class SprintService {
  constructor(private readonly prisma: PrismaService) {}

  /** Starts a new sprint against an in-progress quest. If a sprint is
   * already active or paused for this quest, that sprint is returned as-is
   * instead of creating a second one — idempotent, and prevents two
   * concurrent timers racing on the same quest. */
  async start(
    userId: string,
    questId: string,
    dto: CreateSprintDto,
  ): Promise<Sprint> {
    const quest = await this.findOwnedQuest(userId, questId);
    if (quest.status !== QuestStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Quest must be in progress to start a sprint',
      );
    }

    const existing = await this.prisma.sprint.findFirst({
      where: {
        questId,
        status: { in: [SprintStatus.ACTIVE, SprintStatus.PAUSED] },
      },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.sprint.create({
      data: { questId, targetSeconds: dto.targetSeconds },
    });
  }

  async listForQuest(userId: string, questId: string): Promise<Sprint[]> {
    await this.findOwnedQuest(userId, questId);
    return this.prisma.sprint.findMany({
      where: { questId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Already-paused or resolved sprints are returned as-is — same
   * idempotent pattern used throughout QuestService. */
  async pause(userId: string, sprintId: string): Promise<Sprint> {
    const sprint = await this.findOwnedSprint(userId, sprintId);
    if (sprint.status !== SprintStatus.ACTIVE) {
      return sprint;
    }
    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: { status: SprintStatus.PAUSED, pausedAt: new Date() },
    });
  }

  /** Folds the just-finished pause interval into pausedSeconds (rather than
   * leaving it as a live pausedAt timestamp) so pause/resume can be cycled
   * any number of times without losing precision. Already-active or
   * resolved sprints are returned as-is. */
  async resume(userId: string, sprintId: string): Promise<Sprint> {
    const sprint = await this.findOwnedSprint(userId, sprintId);
    if (sprint.status !== SprintStatus.PAUSED) {
      return sprint;
    }
    const pausedAt = sprint.pausedAt ?? new Date();
    const additionalPausedSeconds = Math.floor(
      (Date.now() - pausedAt.getTime()) / 1000,
    );
    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        status: SprintStatus.ACTIVE,
        pausedAt: null,
        pausedSeconds: sprint.pausedSeconds + additionalPausedSeconds,
      },
    });
  }

  /** Only accepts completion once real elapsed active time — computed here
   * from startedAt/pausedAt/pausedSeconds, never trusted from the client —
   * has reached the sprint's target. This, combined with the flat
   * FOCUS_XP_REWARD regardless of overrun, is what makes the reward
   * resistant to idle timers: you cannot finish faster than real time
   * passes, and leaving it running longer earns nothing extra. Already-
   * completed sprints are returned as-is without granting the reward
   * again. */
  async complete(
    userId: string,
    sprintId: string,
  ): Promise<{ sprint: Sprint; character: Character }> {
    const sprint = await this.findOwnedSprint(userId, sprintId);

    if (sprint.status === SprintStatus.COMPLETED) {
      const { quest, ...rest } = sprint;
      return { sprint: rest, character: quest.character };
    }

    if (this.elapsedActiveSeconds(sprint) < sprint.targetSeconds) {
      throw new BadRequestException(
        'Sprint target duration has not been reached yet',
      );
    }

    const [completedSprint, character] = await this.prisma.$transaction([
      this.prisma.sprint.update({
        where: { id: sprintId },
        data: { status: SprintStatus.COMPLETED, completedAt: new Date() },
      }),
      this.prisma.character.update({
        where: { id: sprint.quest.characterId },
        data: { xp: { increment: FOCUS_XP_REWARD } },
      }),
      this.prisma.rewardEntry.create({
        data: rewardEntryData({
          characterId: sprint.quest.characterId,
          category: RewardCategory.FOCUS,
          xp: FOCUS_XP_REWARD,
          sourceId: sprintId,
        }),
      }),
    ]);

    return { sprint: completedSprint, character };
  }

  private elapsedActiveSeconds(sprint: Sprint): number {
    const now = Date.now();
    const livePauseMs =
      sprint.status === SprintStatus.PAUSED && sprint.pausedAt
        ? now - sprint.pausedAt.getTime()
        : 0;
    const totalPausedMs = sprint.pausedSeconds * 1000 + livePauseMs;
    return Math.floor(
      (now - sprint.startedAt.getTime() - totalPausedMs) / 1000,
    );
  }

  private async findOwnedSprint(
    userId: string,
    sprintId: string,
  ): Promise<OwnedSprint> {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, quest: { character: { userId } } },
      include: { quest: { include: { character: true } } },
    });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }
    return sprint;
  }

  private async findOwnedQuest(
    userId: string,
    questId: string,
  ): Promise<Quest & { character: Character }> {
    const quest = await this.prisma.quest.findFirst({
      where: { id: questId, character: { userId } },
      include: { character: true },
    });
    if (!quest) {
      throw new NotFoundException('Quest not found');
    }
    return quest;
  }
}
