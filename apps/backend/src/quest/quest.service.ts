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
} from '../generated/prisma/client';
import { isSameUtcDay, utcDayStart } from '../common/date.util';
import { rewardEntryData } from '../reward-ledger/reward-entry';
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

/** The Daily reward loop's first cadence (rewards-retention.md): "First
 * Brave Step bonus" — a flat bonus on top of a quest's normal reward for
 * the first quest a player *completes* (not split) on a given UTC day.
 * Fires at most once per day, checked against Character.firstBraveStepDay —
 * a pure completion-triggered grant, no login or passive-time component, so
 * it can't be farmed by idle timers. */
export const FIRST_BRAVE_STEP_XP_REWARD = 10;
export const FIRST_BRAVE_STEP_COIN_REWARD = 5;

/** "Today's Three": up to TODAYS_THREE_MAX quests a player can designate
 * per UTC day (see designateTodaysThree). Completing a designated quest
 * grants this bonus on top of its normal reward — same idle-timer-resistant
 * shape as First Brave Step, gated purely on a real completion. */
export const TODAYS_THREE_MAX = 3;
export const TODAYS_THREE_BONUS_XP_REWARD = 10;
export const TODAYS_THREE_BONUS_COIN_REWARD = 5;

@Injectable()
export class QuestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    characterId: string,
    dto: CreateQuestDto,
  ): Promise<Quest> {
    await this.findOwnedCharacter(userId, characterId);
    return this.prisma.quest.create({
      data: { characterId, title: dto.title },
    });
  }

  async listForCharacter(
    userId: string,
    characterId: string,
  ): Promise<Quest[]> {
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
  async continue(
    userId: string,
    questId: string,
    idempotencyKey?: string,
  ): Promise<Quest> {
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
   * consistent contract across all four resolution endpoints.
   *
   * Also grants the Daily reward loop's two completion-triggered bonuses,
   * stacked on top of the normal QUEST_XP_REWARD/QUEST_COIN_REWARD in the
   * same transaction: First Brave Step (once per UTC day, any quest) and
   * the Today's Three bonus (if this specific quest was designated for
   * today). Neither applies to split() — a split is explicitly "won't be
   * finished as scoped," which doesn't match either bonus's "you finished
   * something today" framing. */
  async complete(
    userId: string,
    questId: string,
    idempotencyKey?: string,
  ): Promise<{
    quest: Quest;
    character: Character;
    firstBraveStepBonusGranted: boolean;
    todaysThreeBonusGranted: boolean;
  }> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (
      this.isDuplicateCall(quest, idempotencyKey) ||
      this.isResolved(quest.status)
    ) {
      const { character, ...rest } = quest;
      return {
        quest: rest,
        character,
        firstBraveStepBonusGranted: false,
        todaysThreeBonusGranted: false,
      };
    }

    const now = new Date();
    const firstBraveStepBonusGranted = !isSameUtcDay(
      quest.character.firstBraveStepDay,
      now,
    );
    const todaysThreeBonusGranted = isSameUtcDay(quest.todaysThreeDay, now);
    const xpReward =
      QUEST_XP_REWARD +
      (firstBraveStepBonusGranted ? FIRST_BRAVE_STEP_XP_REWARD : 0) +
      (todaysThreeBonusGranted ? TODAYS_THREE_BONUS_XP_REWARD : 0);
    const coinReward =
      QUEST_COIN_REWARD +
      (firstBraveStepBonusGranted ? FIRST_BRAVE_STEP_COIN_REWARD : 0) +
      (todaysThreeBonusGranted ? TODAYS_THREE_BONUS_COIN_REWARD : 0);

    const nextStage = Math.min(
      quest.character.campConstructionStage + 1,
      MAX_CONSTRUCTION_STAGE,
    );
    // One ledger entry per *category*, not one per call: the Chronicle
    // reports "where did this week's XP come from", which a single merged
    // row couldn't answer.
    const ledgerEntries = [
      rewardEntryData({
        characterId: quest.characterId,
        category: RewardCategory.QUEST,
        xp: QUEST_XP_REWARD,
        coins: QUEST_COIN_REWARD,
        sourceId: questId,
      }),
    ];
    if (firstBraveStepBonusGranted) {
      ledgerEntries.push(
        rewardEntryData({
          characterId: quest.characterId,
          category: RewardCategory.FIRST_BRAVE_STEP,
          xp: FIRST_BRAVE_STEP_XP_REWARD,
          coins: FIRST_BRAVE_STEP_COIN_REWARD,
          sourceId: questId,
        }),
      );
    }
    if (todaysThreeBonusGranted) {
      ledgerEntries.push(
        rewardEntryData({
          characterId: quest.characterId,
          category: RewardCategory.TODAYS_THREE,
          xp: TODAYS_THREE_BONUS_XP_REWARD,
          coins: TODAYS_THREE_BONUS_COIN_REWARD,
          sourceId: questId,
        }),
      );
    }

    const [completedQuest, character] = await this.prisma.$transaction([
      this.prisma.quest.update({
        where: { id: questId },
        data: {
          status: QuestStatus.COMPLETED,
          completedAt: now,
          resolvedAt: now,
          lastIdempotencyKey: idempotencyKey ?? quest.lastIdempotencyKey,
        },
      }),
      this.prisma.character.update({
        where: { id: quest.characterId },
        data: {
          campConstructionStage: nextStage,
          xp: { increment: xpReward },
          coins: { increment: coinReward },
          firstBraveStepDay: firstBraveStepBonusGranted
            ? utcDayStart(now)
            : undefined,
        },
      }),
      // Same transaction as the balance change above — a reward can never
      // exist without its ledger row, or the row without the reward.
      this.prisma.rewardEntry.createMany({ data: ledgerEntries }),
    ]);

    return {
      quest: completedQuest,
      character,
      firstBraveStepBonusGranted,
      todaysThreeBonusGranted,
    };
  }

  /** Retreats from an open or in-progress quest: a deliberate, penalty-free
   * resolution (see documentation/product/rewards-retention.md's ethical
   * rules — "rest days and comeback quests are legitimate play"). Grants no
   * reward and does not touch camp construction. Already-resolved quests
   * are returned as-is, same idempotent pattern as complete(). */
  async retreat(
    userId: string,
    questId: string,
    idempotencyKey?: string,
  ): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (
      this.isDuplicateCall(quest, idempotencyKey) ||
      this.isResolved(quest.status)
    ) {
      return quest;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: {
        status: QuestStatus.RETREATED,
        resolvedAt: new Date(),
        lastIdempotencyKey: idempotencyKey ?? quest.lastIdempotencyKey,
      },
    });
  }

  /** The "Split" resolution (game-loop.md's fourth of five): partial credit
   * for a quest that made real progress but won't be finished as scoped —
   * grants half QUEST_XP_REWARD/QUEST_COIN_REWARD (rounded down, see
   * SPLIT_XP_REWARD/SPLIT_COIN_REWARD) and resolves the quest, distinct from
   * both Complete (full credit) and Retreat (no credit). Does not touch camp
   * construction — half credit for the quest's own reward, not the shared
   * bridge stage. Same transactional/idempotent shape as complete(). */
  async split(
    userId: string,
    questId: string,
    idempotencyKey?: string,
  ): Promise<{ quest: Quest; character: Character }> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (
      this.isDuplicateCall(quest, idempotencyKey) ||
      this.isResolved(quest.status)
    ) {
      const { character, ...rest } = quest;
      return { quest: rest, character };
    }

    const [splitQuest, character] = await this.prisma.$transaction([
      this.prisma.quest.update({
        where: { id: questId },
        data: {
          status: QuestStatus.SPLIT,
          resolvedAt: new Date(),
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
      this.prisma.rewardEntry.create({
        data: rewardEntryData({
          characterId: quest.characterId,
          category: RewardCategory.SPLIT,
          xp: SPLIT_XP_REWARD,
          coins: SPLIT_COIN_REWARD,
          sourceId: questId,
        }),
      }),
    ]);

    return { quest: splitQuest, character };
  }

  /** Designates a quest as one of today's (UTC) "Today's Three" — see
   * TODAYS_THREE_MAX/TODAYS_THREE_BONUS_XP_REWARD. Idempotent if already
   * designated today. Rejects (BadRequestException, a genuinely invalid
   * request rather than an already-there no-op) a resolved quest — there's
   * no reward left to bonus — and rejects once TODAYS_THREE_MAX is already
   * reached for today. */
  async designateTodaysThree(userId: string, questId: string): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);
    const now = new Date();

    if (this.isResolved(quest.status)) {
      throw new BadRequestException(
        "Cannot designate a resolved quest for Today's Three",
      );
    }
    if (isSameUtcDay(quest.todaysThreeDay, now)) {
      return quest;
    }

    const today = utcDayStart(now);
    const designatedToday = await this.prisma.quest.count({
      where: { characterId: quest.characterId, todaysThreeDay: today },
    });
    if (designatedToday >= TODAYS_THREE_MAX) {
      throw new BadRequestException(
        `Only ${TODAYS_THREE_MAX} quests can be designated as Today's Three per day`,
      );
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: { todaysThreeDay: today },
    });
  }

  /** Removes today's Today's Three designation, if any — idempotent no-op
   * if the quest wasn't designated today (matches complete/continue/
   * retreat's forgiving-on-repeat style). */
  async undesignateTodaysThree(
    userId: string,
    questId: string,
  ): Promise<Quest> {
    const quest = await this.findOwnedQuest(userId, questId);

    if (!isSameUtcDay(quest.todaysThreeDay, new Date())) {
      return quest;
    }

    return this.prisma.quest.update({
      where: { id: questId },
      data: { todaysThreeDay: null },
    });
  }

  private isResolved(status: QuestStatus): boolean {
    return (
      status === QuestStatus.COMPLETED ||
      status === QuestStatus.RETREATED ||
      status === QuestStatus.SPLIT
    );
  }

  /** A duplicate network retry of the same resolution call — same quest,
   * same client-supplied key as the one already processed. Only meaningful
   * for continue() today (see its docblock), but checked uniformly across
   * all four resolution methods for a consistent idempotency contract. */
  private isDuplicateCall(quest: Quest, idempotencyKey?: string): boolean {
    return (
      idempotencyKey != null && quest.lastIdempotencyKey === idempotencyKey
    );
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

  private async findOwnedCharacter(
    userId: string,
    characterId: string,
  ): Promise<Character> {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, userId },
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return character;
  }
}
