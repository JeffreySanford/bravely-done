import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toCharacterDto } from '../character/character.mapper';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CompleteSprintResponseDto } from './dto/complete-sprint-response.dto';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { SprintDto } from './dto/sprint.dto';
import { toSprintDto } from './sprint.mapper';
import { SprintService } from './sprint.service';

@ApiTags('sprints')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SprintController {
  constructor(private readonly sprints: SprintService) {}

  @Post('quests/:questId/sprints')
  @ApiOperation({ summary: 'Start a focused work sprint against an in-progress quest' })
  @ApiCreatedResponse({ type: SprintDto })
  async start(
    @CurrentUser() user: JwtPayload,
    @Param('questId') questId: string,
    @Body() dto: CreateSprintDto,
  ): Promise<SprintDto> {
    const sprint = await this.sprints.start(user.sub, questId, dto);
    return toSprintDto(sprint);
  }

  @Get('quests/:questId/sprints')
  @ApiOperation({ summary: "List a quest's sprints, oldest first" })
  @ApiOkResponse({ type: SprintDto, isArray: true })
  async list(@CurrentUser() user: JwtPayload, @Param('questId') questId: string): Promise<SprintDto[]> {
    const sprints = await this.sprints.listForQuest(user.sub, questId);
    return sprints.map(toSprintDto);
  }

  @Post('sprints/:id/pause')
  @ApiOperation({ summary: 'Pause an active sprint' })
  @ApiOkResponse({ type: SprintDto })
  async pause(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<SprintDto> {
    const sprint = await this.sprints.pause(user.sub, id);
    return toSprintDto(sprint);
  }

  @Post('sprints/:id/resume')
  @ApiOperation({ summary: 'Resume a paused sprint' })
  @ApiOkResponse({ type: SprintDto })
  async resume(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<SprintDto> {
    const sprint = await this.sprints.resume(user.sub, id);
    return toSprintDto(sprint);
  }

  @Post('sprints/:id/complete')
  @ApiOperation({ summary: 'Complete a sprint once its target duration has genuinely elapsed, granting Focus XP' })
  @ApiOkResponse({ type: CompleteSprintResponseDto })
  async complete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<CompleteSprintResponseDto> {
    const { sprint, character } = await this.sprints.complete(user.sub, id);
    const dto = new CompleteSprintResponseDto();
    dto.sprint = toSprintDto(sprint);
    dto.character = toCharacterDto(character);
    return dto;
  }
}
