import { Quest } from '../generated/prisma/client';
import { isSameUtcDay } from '../common/date.util';
import { QuestDto } from './dto/quest.dto';

export function toQuestDto(quest: Quest): QuestDto {
  const dto = new QuestDto();
  dto.id = quest.id;
  dto.characterId = quest.characterId;
  dto.title = quest.title;
  dto.status = quest.status;
  dto.createdAt = quest.createdAt;
  dto.completedAt = quest.completedAt;
  dto.lastContinuedAt = quest.lastContinuedAt;
  dto.isTodaysThree = isSameUtcDay(quest.todaysThreeDay, new Date());
  return dto;
}
