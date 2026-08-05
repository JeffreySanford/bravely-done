import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Body for the quest resolution endpoints (complete/continue/retreat/
 * split). The idempotency key is client-generated (a fresh UUID per click)
 * and optional so older clients keep working without it — see
 * QuestService's isDuplicateCall for how it's used. */
export class ResolveQuestDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;
}
