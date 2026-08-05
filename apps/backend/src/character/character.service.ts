import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Character } from '../generated/prisma/client';
import { CreateCharacterDto } from './dto/create-character.dto';

/** Workbench is fully upgraded once this many upgrades have been bought. */
export const WORKBENCH_MAX_LEVEL = 3;
/** Coin cost to go from level i to i+1 — index 0 is the cost of the first
 * upgrade. Deterministic and increasing, no randomness. No actual
 * capability unlocks are wired to workbenchLevel yet — see planning/02. */
export const WORKBENCH_UPGRADE_COSTS = [10, 20, 30];

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

  /** Spends coins for a workbench upgrade. Already-maxed workbenches are
   * returned as-is (idempotent, same pattern as arrive()/quest resolution).
   * Throws BadRequestException — not silently ignored — when the character
   * can't afford the next level, so the frontend gets a real error to
   * surface rather than a false success. */
  async upgradeWorkbench(userId: string, characterId: string): Promise<Character> {
    const character = await this.findOwned(userId, characterId);

    if (character.workbenchLevel >= WORKBENCH_MAX_LEVEL) {
      return character;
    }

    const cost = WORKBENCH_UPGRADE_COSTS[character.workbenchLevel];
    if (character.coins < cost) {
      throw new BadRequestException('Not enough coins for the next workbench upgrade');
    }

    return this.prisma.character.update({
      where: { id: characterId },
      data: { coins: { decrement: cost }, workbenchLevel: { increment: 1 } },
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
