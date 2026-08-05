import { ApiProperty } from '@nestjs/swagger';
import { QuestStatus } from '../../generated/prisma/enums';

export class QuestDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  characterId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: QuestStatus })
  status!: QuestStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: Date, required: false, nullable: true })
  completedAt!: Date | null;

  @ApiProperty({ type: Date, required: false, nullable: true })
  lastContinuedAt!: Date | null;

  /// Whether this quest is currently designated as one of today's (UTC)
  /// "Today's Three" (rewards-retention.md's Daily cadence) — computed
  /// server-side from Quest.todaysThreeDay against the current UTC day, not
  /// exposed as a raw date so the client never has to do its own day-
  /// boundary math.
  @ApiProperty()
  isTodaysThree!: boolean;
}
