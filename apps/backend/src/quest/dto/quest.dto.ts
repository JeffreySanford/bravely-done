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
}
