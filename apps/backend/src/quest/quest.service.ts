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

/** Half credit for the Split resolution (rounded down) — see split(). */
export const SPLIT_XP_REWARD = Math.floor(QUEST_XP_REWARD / 2);
export const SPLIT_COIN_REWARD = Math.floor(QUEST_COIN_REWARD / 2);

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
   * every time. This is exactly why idempotencyKey matters here specifically
   * (see isDuplicateCall): status alone can't distinguish a genuine second
   * continue from a duplicate network retry of the first. Grants no reward,
   * same precedent as retreat. Already-resolved quests (completed, retreated,
   * or split) are returned as-is. */
  async continue(userId: string, questId: string, idempotencyKey?: string): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (this.isDuplicateCall(quest, idempotencyKey)) {
      return quest;
    }
    if (this.isResolved(quest.status)) {
      return quest;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: {
        status: QuestStatus.IN_PROGRESS,
        lastContinuedAt: new Date(),
        lastIdempotencyKey: idempotencyKey ?? quest.lastIdempotencyKey,
      },
    });
  }

  /** Completes an open or in-progress quest: advances the owning character's
   * bridge construction stage by one (capped at MAX_CONSTRUCTION_STAGE) and
   * grants a deterministic XP/coin reward, applied together in one
   * transaction so a quest can never end up "completed" without its reward
   * or vice versa. Already-resolved quests (completed, retreated, or split)
   * are returned as-is without granting a reward again — naturally
   * idempotent by status alone, but idempotencyKey is still honored for a
   * consistent contract across all four resolution endpoints. */
  async complete(userId: string, questId: string, idempotencyKey?: string): Promise<{ quest: Quest; character: Character }> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (this.isDuplicateCall(quest, idempotencyKey) || this.isResolved(quest.status)) {
      const { character, ...rest } = quest;
      return { quest: rest, character };
    }

    const nextStage = Math.min(quest.character.campConstructionStage + 1, MAX_CONSTRUCTION_STAGE);
    const [completedQuest, character] = await this.prisma.$transaction([
      this.prisma.quest.update({
        where: { id: questId },
        data: {
          status: QuestStatus.COMPLETED,
          completedAt: new Date(),
          lastIdempotencyKey: idempotencyKey ?? quest.lastIdempotencyKey,
        },
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
  async retreat(userId: string, questId: string, idempotencyKey?: string): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (this.isDuplicateCall(quest, idempotencyKey) || this.isResolved(quest.status)) {
      return quest;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: { status: QuestStatus.RETREATED, lastIdempotencyKey: idempotencyKey ?? quest.lastIdempotencyKey },
    });
  }

  /** The "Split" resolution (game-loop.md's fourth of five): partial credit
   * for a quest that made real progress but won't be finished as scoped —
   * grants half QUEST_XP_REWARD/QUEST_COIN_REWARD (rounded down, see
   * SPLIT_XP_REWARD/SPLIT_COIN_REWARD) and resolves the quest, distinct from
   * both Complete (full credit) and Retreat (no credit). Does not touch camp
   * construction — half credit for the quest's own reward, not the shared
   * bridge stage. Same transactional/idempotent shape as complete(). */
  async split(userId: string, questId: string, idempotencyKey?: string): Promise<{ quest: Quest; character: Character }> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (this.isDuplicateCall(quest, idempotencyKey) || this.isResolved(quest.status)) {
      const { character, ...rest } = quest;
      return { quest: rest, character };
    }

    const [splitQuest, character] = await this.prisma.$transaction([
      this.prisma.quest.update({
        where: { id: questId },
        data: {
          status: QuestStatus.SPLIT,
          lastIdempotencyKey: idempotencyKey ?? quest.lastIdempotencyKey,
        },
      }),
      this.prisma.character.update({
        where: { id: quest.characterId },
        data: {
          xp: { increment: SPLIT_XP_REWARD },
          coins: { increment: SPLIT_COIN_REWARD },
        },
      }),
    ]);

    return { quest: splitQuest, character };
  }

  private isResolved(status: QuestStatus): boolean {
    return status === QuestStatus.COMPLETED || status === QuestStatus.RETREATED || status === QuestStatus.SPLIT;
  }

  /** A duplicate network retry of the same resolution call — same quest,
   * same client-supplied key as the one already processed. Only meaningful
   * for continue() today (see its docblock), but checked uniformly across
   * all four resolution methods for a consistent idempotency contract. */
  private isDuplicateCall(quest: Quest, idempotencyKey?: string): boolean {
    return idempotencyKey != null && quest.lastIdempotencyKey === idempotencyKey;
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
