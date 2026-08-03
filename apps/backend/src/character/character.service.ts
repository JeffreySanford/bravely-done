import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Character } from '../generated/prisma/client';
import { CreateCharacterDto } from './dto/create-character.dto';

@Injectable()
export class CharacterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCharacterDto): Promise<Character> {
    return this.prisma.character.create({
      data: { userId, name: dto.name },
    });
  }

  async listForUser(userId: string): Promise<Character[]> {
    return this.prisma.character.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
