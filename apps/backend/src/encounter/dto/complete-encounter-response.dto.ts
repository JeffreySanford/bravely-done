import { ApiProperty } from '@nestjs/swagger';
import { CharacterDto } from '../../character/dto/character.dto';
import { EncounterDto } from './encounter.dto';

export class CompleteEncounterResponseDto {
  @ApiProperty({ type: EncounterDto })
  encounter!: EncounterDto;

  @ApiProperty({ type: CharacterDto })
  character!: CharacterDto;
}
