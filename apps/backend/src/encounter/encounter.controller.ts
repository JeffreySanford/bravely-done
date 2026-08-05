import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { toCharacterDto } from '../character/character.mapper';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CompleteEncounterResponseDto } from './dto/complete-encounter-response.dto';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { EncounterDto } from './dto/encounter.dto';
import { toEncounterDto } from './encounter.mapper';
import { EncounterService } from './encounter.service';

@ApiTags('encounters')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EncounterController {
  constructor(private readonly encounters: EncounterService) {}

  @Post('quests/:questId/encounters')
  @ApiOperation({ summary: 'Add a small actionable step to a quest' })
  @ApiCreatedResponse({ type: EncounterDto })
  async create(
    @CurrentUser() user: JwtPayload,
    @Param('questId') questId: string,
    @Body() dto: CreateEncounterDto,
  ): Promise<EncounterDto> {
    const encounter = await this.encounters.create(user.sub, questId, dto);
    return toEncounterDto(encounter);
  }

  @Get('quests/:questId/encounters')
  @ApiOperation({ summary: "List a quest's encounters, oldest first" })
  @ApiOkResponse({ type: EncounterDto, isArray: true })
  async list(@CurrentUser() user: JwtPayload, @Param('questId') questId: string): Promise<EncounterDto[]> {
    const encounters = await this.encounters.listForQuest(user.sub, questId);
    return encounters.map(toEncounterDto);
  }

  @Post('encounters/:id/complete')
  @ApiOperation({ summary: 'Complete an encounter, granting Courage XP' })
  @ApiOkResponse({ type: CompleteEncounterResponseDto })
  async complete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<CompleteEncounterResponseDto> {
    const { encounter, character } = await this.encounters.complete(user.sub, id);
    const dto = new CompleteEncounterResponseDto();
    dto.encounter = toEncounterDto(encounter);
    dto.character = toCharacterDto(character);
    return dto;
  }
}
