import { ApiProperty } from '@nestjs/swagger';
import { RewardCategory } from '../../generated/prisma/enums';

/** What kind of thing happened. Deliberately covers every *resolution* a
 * quest can reach, not just completions — the Chronicle's job is an honest
 * account of the week, and rewards-retention.md is explicit that retreating
 * is legitimate play, not failure. A week of retreats is still a week that
 * happened. */
export enum ChronicleEntryKind {
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  QUEST_SPLIT = 'QUEST_SPLIT',
  QUEST_RETREATED = 'QUEST_RETREATED',
  QUEST_CONTINUED = 'QUEST_CONTINUED',
  SPRINT_COMPLETED = 'SPRINT_COMPLETED',
  ENCOUNTER_COMPLETED = 'ENCOUNTER_COMPLETED',
}

export class ChronicleEntryDto {
  @ApiProperty({ enum: ChronicleEntryKind })
  kind!: ChronicleEntryKind;

  /// The quest or encounter title, so an entry reads as "Answer three
  /// emails" rather than an opaque id.
  @ApiProperty()
  title!: string;

  @ApiProperty()
  at!: Date;
}

export class ChronicleRewardBreakdownDto {
  @ApiProperty({ enum: RewardCategory })
  category!: RewardCategory;

  @ApiProperty()
  xp!: number;

  @ApiProperty()
  coins!: number;
}

export class ChronicleDto {
  @ApiProperty()
  characterId!: string;

  /// Inclusive start of the window (midnight UTC, `days` - 1 days back).
  @ApiProperty()
  from!: Date;

  /// When the Chronicle was generated — the exclusive end of the window.
  @ApiProperty()
  to!: Date;

  @ApiProperty()
  days!: number;

  @ApiProperty()
  questsCompleted!: number;

  @ApiProperty()
  questsSplit!: number;

  @ApiProperty()
  questsRetreated!: number;

  /// Quests *continued* during the window. Counts distinct quests, not
  /// continues: `Quest.lastContinuedAt` only records the most recent one, so
  /// a quest continued four times this week is honestly reportable as
  /// "continued", not as four events.
  @ApiProperty()
  questsContinued!: number;

  @ApiProperty()
  sprintsCompleted!: number;

  /// Committed focus time from completed sprints, derived from each
  /// sprint's `targetSeconds`. Deliberately not actual elapsed time: a
  /// sprint can only complete once real elapsed time reaches its target, so
  /// the target is the honest floor, while elapsed would over-count a
  /// sprint that was simply left running afterwards.
  @ApiProperty()
  focusMinutes!: number;

  @ApiProperty()
  encountersCompleted!: number;

  /// XP earned in the window, summed from the reward ledger
  /// (`apps/backend/src/reward-ledger/`). Real, not estimated: before the
  /// ledger existed this could only have been guessed by multiplying event
  /// counts by *today's* reward constants, which would misreport history
  /// the moment a constant changed.
  @ApiProperty()
  xpEarned!: number;

  /// Net coins for the window — grants minus spends, since a workbench
  /// upgrade is recorded as a negative entry. Can legitimately be negative
  /// in a week where the player spent more than they earned.
  @ApiProperty()
  coinsEarned!: number;

  /// Where the XP came from, so "85 XP" can be broken down rather than
  /// being an unexplained number. Categories with nothing in them are
  /// omitted.
  @ApiProperty({ type: ChronicleRewardBreakdownDto, isArray: true })
  rewardBreakdown!: ChronicleRewardBreakdownDto[];

  /// The concrete events, newest first, capped at CHRONICLE_MAX_ENTRIES.
  /// The counts above are always complete even when this list is truncated.
  @ApiProperty({ type: ChronicleEntryDto, isArray: true })
  entries!: ChronicleEntryDto[];
}
