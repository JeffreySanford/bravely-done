import { ApiProperty } from '@nestjs/swagger';
import { CharacterDto } from '../../character/dto/character.dto';
import { SprintDto } from './sprint.dto';

export class CompleteSprintResponseDto {
  @ApiProperty({ type: SprintDto })
  sprint!: SprintDto;

  @ApiProperty({ type: CharacterDto })
  character!: CharacterDto;
}
