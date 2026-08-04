import { Injectable, NotFoundException } from '@nestjs/common';
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

  /** Marks the character as having reached Base Camp. Idempotent — only the
   * first call for a given character reports `firstArrival: true`. */
  async arrive(userId: string, characterId: string): Promise<{ firstArrival: boolean; character: Character }> {
    const character = await this.findOwned(userId, characterId);

    if (character.hasArrivedAtCamp) {
      return { firstArrival: false, character };
    }

    const updated = await this.prisma.character.update({
      where: { id: characterId },
      data: { hasArrivedAtCamp: true },
    });
    return { firstArrival: true, character: updated };
  }

  private async findOwned(userId: string, characterId: string): Promise<Character> {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, userId },
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return character;
  }
}
