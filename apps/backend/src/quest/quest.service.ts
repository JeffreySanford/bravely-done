import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Character, Quest, QuestStatus } from '../generated/prisma/client';
import { CreateQuestDto } from './dto/create-quest.dto';

/** Bridge is fully repaired once this many quests have been completed. */
export const MAX_CONSTRUCTION_STAGE = 3;

/** Deterministic per-quest reward (see documentation/product/rewards-
 * retention.md's reward categories: "Quest XP for completion", "Coins for
 * ordinary progress"). Not randomized — the same completion always grants
 * the same amount, matching TODO.md's "Grant deterministic XP, coins, and
 * materials" (materials are represented by campConstructionStage, not a
 * separate counter — see planning/02-base-camp-animations.md). */
export const QUEST_XP_REWARD = 20;
export const QUEST_COIN_REWARD = 10;

@Injectable()
export class QuestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, characterId: string, dto: CreateQuestDto): Promise<Quest> {
    await this.findOwnedCharacter(userId, characterId);
    return this.prisma.quest.create({
      data: { characterId, title: dto.title },
    });
  }

  async listForCharacter(userId: string, characterId: string): Promise<Quest[]> {
    await this.findOwnedCharacter(userId, characterId);
    return this.prisma.quest.findMany({
      where: { characterId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Moves a quest from the backlog into the board's "In Progress" column —
   * a real, player-driven signal of intent, not just a display grouping.
   * Already-started quests (in progress or resolved) are returned as-is,
   * same idempotent pattern as complete/retreat. */
  async start(userId: string, questId: string): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (quest.status !== QuestStatus.OPEN) {
      return quest;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: { status: QuestStatus.IN_PROGRESS },
    });
  }

  /** The "Continue" resolution (game-loop.md: "meaningful progress made;
   * another encounter remains") — an honest way to end a work session on a
   * quest that isn't done, distinct from Retreat's "no progress needed"
   * framing. Ensures the quest is at least IN_PROGRESS (same forward-only
   * move as start()) and stamps lastContinuedAt. Unlike start/complete/
   * retreat, repeated calls are meaningful, not just a no-op — a player may
   * continue the same quest across many sessions, so the timestamp updates
   * every time. Grants no reward, same precedent as retreat. Already-
   * resolved quests (completed or retreated) are returned as-is. */
  async continue(userId: string, questId: string): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (quest.status === QuestStatus.COMPLETED || quest.status === QuestStatus.RETREATED) {
      return quest;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: { status: QuestStatus.IN_PROGRESS, lastContinuedAt: new Date() },
    });
  }

  /** Completes an open or in-progress quest: advances the owning character's
   * bridge construction stage by one (capped at MAX_CONSTRUCTION_STAGE) and
   * grants a deterministic XP/coin reward, applied together in one
   * transaction so a quest can never end up "completed" without its reward
   * or vice versa. Already-resolved quests (completed or retreated) are
   * returned as-is without granting a reward again. */
  async complete(userId: string, questId: string): Promise<{ quest: Quest; character: Character }> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (quest.status === QuestStatus.COMPLETED || quest.status === QuestStatus.RETREATED) {
      const { character, ...rest } = quest;
      return { quest: rest, character };
    }

    const nextStage = Math.min(quest.character.campConstructionStage + 1, MAX_CONSTRUCTION_STAGE);
    const [completedQuest, character] = await this.prisma.$transaction([
      this.prisma.quest.update({
        where: { id: questId },
        data: { status: QuestStatus.COMPLETED, completedAt: new Date() },
      }),
      this.prisma.character.update({
        where: { id: quest.characterId },
        data: {
          campConstructionStage: nextStage,
          xp: { increment: QUEST_XP_REWARD },
          coins: { increment: QUEST_COIN_REWARD },
        },
      }),
    ]);

    return { quest: completedQuest, character };
  }

  /** Retreats from an open or in-progress quest: a deliberate, penalty-free
   * resolution (see documentation/product/rewards-retention.md's ethical
   * rules — "rest days and comeback quests are legitimate play"). Grants no
   * reward and does not touch camp construction. Already-resolved quests
   * are returned as-is, same idempotent pattern as complete(). */
  async retreat(userId: string, questId: string): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (quest.status === QuestStatus.COMPLETED || quest.status === QuestStatus.RETREATED) {
      return quest;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: { status: QuestStatus.RETREATED },
    });
  }

  private async findOwnedQuest(userId: string, questId: string): Promise<Quest & { character: Character }> {
    const quest = await this.prisma.quest.findFirst({
      where: { id: questId, character: { userId } },
      include: { character: true },
    });
    if (!quest) {
      throw new NotFoundException('Quest not found');
    }
    return quest;
  }

  private async findOwnedCharacter(userId: string, characterId: string): Promise<Character> {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, userId },
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return character;
  }
}
