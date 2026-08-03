import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/enums';

export class SessionDto {
  @ApiProperty({ description: 'User id (JWT `sub` claim)' })
  sub!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}
