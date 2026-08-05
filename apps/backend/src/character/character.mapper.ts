import { Character } from '../generated/prisma/client';
import { CharacterDto } from './dto/character.dto';

export function toCharacterDto(character: Character): CharacterDto {
  const dto = new CharacterDto();
  dto.id = character.id;
  dto.name = character.name;
  dto.createdAt = character.createdAt;
  dto.hasArrivedAtCamp = character.hasArrivedAtCamp;
  dto.campConstructionStage = character.campConstructionStage;
  dto.firewoodCount = character.firewoodCount;
  dto.forageCount = character.forageCount;
  dto.xp = character.xp;
  dto.coins = character.coins;
  dto.workbenchLevel = character.workbenchLevel;
  return dto;
}
