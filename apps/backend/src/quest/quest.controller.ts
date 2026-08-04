import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toCharacterDto } from '../character/character.mapper';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CompleteQuestResponseDto } from './dto/complete-quest-response.dto';
import { CreateQuestDto } from './dto/create-quest.dto';
import { QuestDto } from './dto/quest.dto';
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

  @Post('quests/:id/complete')
  @ApiOperation({ summary: 'Complete a quest and advance the camp construction stage' })
  @ApiOkResponse({ type: CompleteQuestResponseDto })
  async complete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<CompleteQuestResponseDto> {
    const { quest, character } = await this.quests.complete(user.sub, id);
    const dto = new CompleteQuestResponseDto();
    dto.quest = toQuestDto(quest);
    dto.character = toCharacterDto(character);
    return dto;
  }
}
