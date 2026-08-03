import { ApiProperty } from '@nestjs/swagger';

export class CharacterDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;
}
