import { ApiProperty } from '@nestjs/swagger';

export class CharacterDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  hasArrivedAtCamp!: boolean;

  @ApiProperty()
  campConstructionStage!: number;

  @ApiProperty()
  firewoodCount!: number;

  @ApiProperty()
  forageCount!: number;

  @ApiProperty()
  xp!: number;

  @ApiProperty()
  coins!: number;
}
