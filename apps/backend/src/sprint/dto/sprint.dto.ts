import { ApiProperty } from '@nestjs/swagger';
import { SprintStatus } from '../../generated/prisma/enums';

export class SprintDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  questId!: string;

  @ApiProperty()
  targetSeconds!: number;

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty({ type: Date, required: false, nullable: true })
  pausedAt!: Date | null;

  @ApiProperty()
  pausedSeconds!: number;

  @ApiProperty({ enum: SprintStatus })
  status!: SprintStatus;

  @ApiProperty({ type: Date, required: false, nullable: true })
  completedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
