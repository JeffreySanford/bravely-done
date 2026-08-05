import { ApiProperty } from '@nestjs/swagger';
import { EncounterStatus } from '../../generated/prisma/enums';

export class EncounterDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  questId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: EncounterStatus })
  status!: EncounterStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: Date, required: false, nullable: true })
  completedAt!: Date | null;
}
