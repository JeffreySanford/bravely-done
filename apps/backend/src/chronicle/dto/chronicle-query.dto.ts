import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  CHRONICLE_DEFAULT_DAYS,
  CHRONICLE_MAX_DAYS,
  CHRONICLE_MIN_DAYS,
} from '../chronicle.service';

export class ChronicleQueryDto {
  /** Bounded so one request can't scan a character's whole history.
   * `@Type(() => Number)` is required because query params arrive as
   * strings — the global ValidationPipe runs with `transform: true`, but
   * it still needs to be told the target type. */
  @ApiPropertyOptional({
    minimum: CHRONICLE_MIN_DAYS,
    maximum: CHRONICLE_MAX_DAYS,
    default: CHRONICLE_DEFAULT_DAYS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(CHRONICLE_MIN_DAYS)
  @Max(CHRONICLE_MAX_DAYS)
  days?: number;
}
