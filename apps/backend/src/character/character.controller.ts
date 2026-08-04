import { Controller, Get, Body, Param, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { Character } from '../generated/prisma/client';
import { CharacterService } from './character.service';
import { ArriveResponseDto } from './dto/arrive-response.dto';
import { CharacterDto } from './dto/character.dto';
import { CreateCharacterDto } from './dto/create-character.dto';

function toCharacterDto(character: Character): CharacterDto {
  const dto = new CharacterDto();
  dto.id = character.id;
  dto.name = character.name;
  dto.createdAt = character.createdAt;
  dto.hasArrivedAtCamp = character.hasArrivedAtCamp;
  dto.campConstructionStage = character.campConstructionStage;
  return dto;
}

@ApiTags('characters')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller('characters')
export class CharacterController {
  constructor(private readonly characters: CharacterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a character for the current user' })
  @ApiCreatedResponse({ type: CharacterDto })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCharacterDto): Promise<CharacterDto> {
    const character = await this.characters.create(user.sub, dto);
    return toCharacterDto(character);
  }

  @Get()
  @ApiOperation({ summary: "List the current user's characters" })
  @ApiOkResponse({ type: CharacterDto, isArray: true })
  async list(@CurrentUser() user: JwtPayload): Promise<CharacterDto[]> {
    const characters = await this.characters.listForUser(user.sub);
    return characters.map(toCharacterDto);
  }

  @Post(':id/arrive')
  @ApiOperation({ summary: 'Mark a character as having reached Base Camp' })
  @ApiOkResponse({ type: ArriveResponseDto })
  async arrive(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ArriveResponseDto> {
    const { firstArrival, character } = await this.characters.arrive(user.sub, id);
    const dto = new ArriveResponseDto();
    dto.firstArrival = firstArrival;
    dto.character = toCharacterDto(character);
    return dto;
  }

  @Post(':id/complete-mock-quest')
  @ApiOperation({ summary: "Advance a character's Base Camp bridge construction stage" })
  @ApiOkResponse({ type: CharacterDto })
  async completeMockQuest(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<CharacterDto> {
    const character = await this.characters.completeMockQuest(user.sub, id);
    return toCharacterDto(character);
  }
}
