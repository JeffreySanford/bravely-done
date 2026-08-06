import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { ChronicleService } from './chronicle.service';
import { ChronicleQueryDto } from './dto/chronicle-query.dto';
import { ChronicleDto } from './dto/chronicle.dto';

@ApiTags('chronicle')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ChronicleController {
  constructor(private readonly chronicle: ChronicleService) {}

  @Get('characters/:characterId/chronicle')
  @ApiOperation({
    summary:
      'A summary of what a character actually did over the last few days',
  })
  @ApiOkResponse({ type: ChronicleDto })
  async forCharacter(
    @CurrentUser() user: JwtPayload,
    @Param('characterId') characterId: string,
    @Query() query: ChronicleQueryDto,
  ): Promise<ChronicleDto> {
    return this.chronicle.forCharacter(user.sub, characterId, query.days);
  }
}
