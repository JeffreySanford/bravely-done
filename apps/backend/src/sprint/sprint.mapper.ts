import { Sprint } from '../generated/prisma/client';
import { SprintDto } from './dto/sprint.dto';

export function toSprintDto(sprint: Sprint): SprintDto {
  const dto = new SprintDto();
  dto.id = sprint.id;
  dto.questId = sprint.questId;
  dto.targetSeconds = sprint.targetSeconds;
  dto.startedAt = sprint.startedAt;
  dto.pausedAt = sprint.pausedAt;
  dto.pausedSeconds = sprint.pausedSeconds;
  dto.status = sprint.status;
  dto.completedAt = sprint.completedAt;
  dto.createdAt = sprint.createdAt;
  return dto;
}
