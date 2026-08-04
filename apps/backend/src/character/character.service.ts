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

  /** Chopping is an infinite ambient action (no per-tree depletion tracked
   * yet) — each call adds one unit of firewood. Uses an atomic increment
   * rather than read-then-write so rapid clicks can't race and drop a
   * chop. */
  async chopTree(userId: string, characterId: string): Promise<Character> {
    await this.findOwned(userId, characterId);
    return this.prisma.character.update({
      where: { id: characterId },
      data: { firewoodCount: { increment: 1 } },
    });
  }

  /** Harvesting is an infinite ambient action (mirrors chopTree) — each
   * call adds one unit of forage. Atomic increment for the same reason. */
  async forage(userId: string, characterId: string): Promise<Character> {
    await this.findOwned(userId, characterId);
    return this.prisma.character.update({
      where: { id: characterId },
      data: { forageCount: { increment: 1 } },
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
