import { Encounter } from '../generated/prisma/client';
import { EncounterDto } from './dto/encounter.dto';

export function toEncounterDto(encounter: Encounter): EncounterDto {
  const dto = new EncounterDto();
  dto.id = encounter.id;
  dto.questId = encounter.questId;
  dto.title = encounter.title;
  dto.status = encounter.status;
  dto.createdAt = encounter.createdAt;
  dto.completedAt = encounter.completedAt;
  return dto;
}
