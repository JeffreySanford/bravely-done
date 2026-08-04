import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Character } from '../generated/prisma/client';
import { CreateCharacterDto } from './dto/create-character.dto';

/** Bridge is fully repaired once this many mock quests have been completed. */
export const MAX_CONSTRUCTION_STAGE = 3;

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

  /** Advances the bridge construction stage by one mock quest completion,
   * capped at MAX_CONSTRUCTION_STAGE. Stands in for a real quest-completion
   * flow (see planning/02-base-camp-animations.md's acceptance criterion). */
  async completeMockQuest(userId: string, characterId: string): Promise<Character> {
    const character = await this.findOwned(userId, characterId);
    const nextStage = Math.min(character.campConstructionStage + 1, MAX_CONSTRUCTION_STAGE);

    return this.prisma.character.update({
      where: { id: characterId },
      data: { campConstructionStage: nextStage },
    });
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
