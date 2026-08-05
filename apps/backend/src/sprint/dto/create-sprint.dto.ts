import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { SPRINT_DURATION_PRESETS_SECONDS } from '../sprint.service';

export class CreateSprintDto {
  @ApiProperty({ enum: SPRINT_DURATION_PRESETS_SECONDS })
  @IsIn(SPRINT_DURATION_PRESETS_SECONDS)
  targetSeconds!: number;
}
