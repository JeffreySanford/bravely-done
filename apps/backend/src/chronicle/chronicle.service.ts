import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EncounterStatus,
  QuestStatus,
  SprintStatus,
} from '../generated/prisma/client';
import { utcDayStart } from '../common/date.util';
import {
  ChronicleDto,
  ChronicleEntryDto,
  ChronicleEntryKind,
} from './dto/chronicle.dto';

/** Default window — the Chronicle is rewards-retention.md's *weekly*
 * artifact, so a week is the natural default. */
export const CHRONICLE_DEFAULT_DAYS = 7;

/** Bounds on the requested window. An open-ended `days` would let one
 * request scan a character's entire history. */
export const CHRONICLE_MIN_DAYS = 1;
export const CHRONICLE_MAX_DAYS = 31;

/** Entry list cap. The summary counts are always complete — only the
 * concrete list is truncated — so a very busy week degrades to "accurate
 * numbers, most recent events" rather than an unbounded payload. */
export const CHRONICLE_MAX_ENTRIES = 100;

@Injectable()
export class ChronicleService {
  constructor(private readonly prisma: PrismaService) {}

  /** An honest account of what actually happened in the window, assembled
   * from timestamps the domain already records — no separate event log.
   *
   * Deliberately reports *no XP or coin totals*. `Character.xp`/`coins` are
   * running aggregates with no per-grant ledger, and `firstBraveStepDay`
   * keeps only the most recent day, so "XP earned this week" cannot be
   * derived — only guessed at by multiplying counts by current constants,
   * which would silently drift from history whenever a reward value changes.
   * A real reward ledger is its own piece of work; until then the Chronicle
   * reports events, which it can state truthfully. */
  async forCharacter(
    userId: string,
    characterId: string,
    days = CHRONICLE_DEFAULT_DAYS,
  ): Promise<ChronicleDto> {
    await this.findOwnedCharacter(userId, characterId);

    const to = new Date();
    const from = this.windowStart(to, days);

    const [resolvedQuests, continuedQuests, sprints, encounters] =
      await Promise.all([
        this.prisma.quest.findMany({
          where: { characterId, resolvedAt: { gte: from, lte: to } },
          select: { title: true, status: true, resolvedAt: true },
        }),
        this.prisma.quest.findMany({
          where: { characterId, lastContinuedAt: { gte: from, lte: to } },
          select: { title: true, lastContinuedAt: true },
        }),
        this.prisma.sprint.findMany({
          where: {
            quest: { characterId },
            status: SprintStatus.COMPLETED,
            completedAt: { gte: from, lte: to },
          },
          select: {
            targetSeconds: true,
            completedAt: true,
            quest: { select: { title: true } },
          },
        }),
        this.prisma.encounter.findMany({
          where: {
            quest: { characterId },
            status: EncounterStatus.COMPLETED,
            completedAt: { gte: from, lte: to },
          },
          select: { title: true, completedAt: true },
        }),
      ]);

    const entries: ChronicleEntryDto[] = [
      ...resolvedQuests.map((quest) =>
        this.entry(this.questKind(quest.status), quest.title, quest.resolvedAt),
      ),
      ...continuedQuests.map((quest) =>
        this.entry(
          ChronicleEntryKind.QUEST_CONTINUED,
          quest.title,
          quest.lastContinuedAt,
        ),
      ),
      ...sprints.map((sprint) =>
        this.entry(
          ChronicleEntryKind.SPRINT_COMPLETED,
          sprint.quest.title,
          sprint.completedAt,
        ),
      ),
      ...encounters.map((encounter) =>
        this.entry(
          ChronicleEntryKind.ENCOUNTER_COMPLETED,
          encounter.title,
          encounter.completedAt,
        ),
      ),
    ].sort((a, b) => b.at.getTime() - a.at.getTime());

    const dto = new ChronicleDto();
    dto.characterId = characterId;
    dto.from = from;
    dto.to = to;
    dto.days = days;
    dto.questsCompleted = this.countByStatus(
      resolvedQuests,
      QuestStatus.COMPLETED,
    );
    dto.questsSplit = this.countByStatus(resolvedQuests, QuestStatus.SPLIT);
    dto.questsRetreated = this.countByStatus(
      resolvedQuests,
      QuestStatus.RETREATED,
    );
    dto.questsContinued = continuedQuests.length;
    dto.sprintsCompleted = sprints.length;
    dto.focusMinutes = Math.round(
      sprints.reduce((total, sprint) => total + sprint.targetSeconds, 0) / 60,
    );
    dto.encountersCompleted = encounters.length;
    dto.entries = entries.slice(0, CHRONICLE_MAX_ENTRIES);
    return dto;
  }

  /** Start of the window: midnight UTC, `days - 1` whole days back — so a
   * 7-day Chronicle covers today plus the six days before it, rather than a
   * rolling 168 hours that would cut today's morning off partway. */
  private windowStart(to: Date, days: number): Date {
    const start = utcDayStart(to);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    return start;
  }

  private entry(
    kind: ChronicleEntryKind,
    title: string,
    at: Date | null,
  ): ChronicleEntryDto {
    const dto = new ChronicleEntryDto();
    dto.kind = kind;
    dto.title = title;
    // Non-null in practice: every row here was selected by a date filter on
    // exactly this column, so a null could not have matched.
    dto.at = at as Date;
    return dto;
  }

  private questKind(status: QuestStatus): ChronicleEntryKind {
    if (status === QuestStatus.COMPLETED) {
      return ChronicleEntryKind.QUEST_COMPLETED;
    }
    return status === QuestStatus.SPLIT
      ? ChronicleEntryKind.QUEST_SPLIT
      : ChronicleEntryKind.QUEST_RETREATED;
  }

  private countByStatus(
    quests: { status: QuestStatus }[],
    status: QuestStatus,
  ): number {
    return quests.filter((quest) => quest.status === status).length;
  }

  private async findOwnedCharacter(
    userId: string,
    characterId: string,
  ): Promise<void> {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, userId },
      select: { id: true },
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
  }
}
