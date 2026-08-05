import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toCharacterDto } from '../character/character.mapper';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CompleteQuestResponseDto } from './dto/complete-quest-response.dto';
import { CreateQuestDto } from './dto/create-quest.dto';
import { QuestDto } from './dto/quest.dto';
import { ResolveQuestDto } from './dto/resolve-quest.dto';
import { toQuestDto } from './quest.mapper';
import { QuestService } from './quest.service';

@ApiTags('quests')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class QuestController {
  constructor(private readonly quests: QuestService) {}

  @Post('characters/:characterId/quests')
  @ApiOperation({ summary: 'Create a quest for a character' })
  @ApiCreatedResponse({ type: QuestDto })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('characterId') characterId: string,
    @Body() dto: CreateQuestDto,
  ): Promise<QuestDto> {
    const quest = await this.quests.create(user.sub, characterId, dto);
    return toQuestDto(quest);
  }

  @Get('characters/:characterId/quests')
  @ApiOperation({ summary: "List a character's quests" })
  @ApiOkResponse({ type: QuestDto, isArray: true })
  async list(@CurrentUser() user: JwtPayload, @Param('characterId') characterId: string): Promise<QuestDto[]> {
    const quests = await this.quests.listForCharacter(user.sub, characterId);
    return quests.map(toQuestDto);
  }

  @Post('quests/:id/start')
  @ApiOperation({ summary: "Move a quest into the board's In Progress column" })
  @ApiOkResponse({ type: QuestDto })
  async start(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<QuestDto> {
    const quest = await this.quests.start(user.sub, id);
    return toQuestDto(quest);
  }

  @Post('quests/:id/continue')
  @ApiOperation({ summary: 'Record an honest "made progress, ending the session here" resolution' })
  @ApiOkResponse({ type: QuestDto })
  async continue(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResolveQuestDto,
  ): Promise<QuestDto> {
    const quest = await this.quests.continue(user.sub, id, dto.idempotencyKey);
    return toQuestDto(quest);
  }

  @Post('quests/:id/complete')
  @ApiOperation({ summary: 'Complete a quest and advance the camp construction stage' })
  @ApiOkResponse({ type: CompleteQuestResponseDto })
  async complete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResolveQuestDto,
  ): Promise<CompleteQuestResponseDto> {
    const { quest, character, firstBraveStepBonusGranted, todaysThreeBonusGranted } = await this.quests.complete(
      user.sub,
      id,
      dto.idempotencyKey,
    );
    const response = new CompleteQuestResponseDto();
    response.quest = toQuestDto(quest);
    response.character = toCharacterDto(character);
    response.firstBraveStepBonusGranted = firstBraveStepBonusGranted;
    response.todaysThreeBonusGranted = todaysThreeBonusGranted;
    return response;
  }

  @Post('quests/:id/retreat')
  @ApiOperation({ summary: 'Retreat from a quest with no penalty and no reward' })
  @ApiOkResponse({ type: QuestDto })
  async retreat(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResolveQuestDto,
  ): Promise<QuestDto> {
    const quest = await this.quests.retreat(user.sub, id, dto.idempotencyKey);
    return toQuestDto(quest);
  }

  @Post('quests/:id/split')
  @ApiOperation({ summary: 'Split a quest for partial credit — half reward, resolved' })
  @ApiOkResponse({ type: CompleteQuestResponseDto })
  async split(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResolveQuestDto,
  ): Promise<CompleteQuestResponseDto> {
    const { quest, character } = await this.quests.split(user.sub, id, dto.idempotencyKey);
    const response = new CompleteQuestResponseDto();
    response.quest = toQuestDto(quest);
    response.character = toCharacterDto(character);
    response.firstBraveStepBonusGranted = false;
    response.todaysThreeBonusGranted = false;
    return response;
  }

  @Post('quests/:id/todays-three')
  @ApiOperation({ summary: "Designate a quest as one of today's (UTC) Today's Three" })
  @ApiOkResponse({ type: QuestDto })
  async designateTodaysThree(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<QuestDto> {
    const quest = await this.quests.designateTodaysThree(user.sub, id);
    return toQuestDto(quest);
  }

  @Delete('quests/:id/todays-three')
  @ApiOperation({ summary: "Remove a quest's Today's Three designation" })
  @ApiOkResponse({ type: QuestDto })
  async undesignateTodaysThree(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<QuestDto> {
    const quest = await this.quests.undesignateTodaysThree(user.sub, id);
    return toQuestDto(quest);
  }
}
