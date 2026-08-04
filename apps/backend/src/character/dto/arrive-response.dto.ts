import { ApiProperty } from '@nestjs/swagger';
import { CharacterDto } from './character.dto';

export class ArriveResponseDto {
  /** True only the first time this character ever reaches Base Camp. */
  @ApiProperty()
  firstArrival!: boolean;

  @ApiProperty({ type: CharacterDto })
  character!: CharacterDto;
}
