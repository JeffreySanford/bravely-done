import { ApiProperty } from '@nestjs/swagger';
import { CharacterDto } from '../../character/dto/character.dto';
import { QuestDto } from './quest.dto';

export class CompleteQuestResponseDto {
  @ApiProperty({ type: QuestDto })
  quest!: QuestDto;

  @ApiProperty({ type: CharacterDto })
  character!: CharacterDto;
}
