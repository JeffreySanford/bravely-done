import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Character, RewardCategory } from '../generated/prisma/client';
import { rewardEntryData } from '../reward-ledger/reward-entry';
import { CreateCharacterDto } from './dto/create-character.dto';

/** Workbench is fully upgraded once this many upgrades have been bought. */
export const WORKBENCH_MAX_LEVEL = 3;
/** Coin cost to go from level i to i+1 — index 0 is the cost of the first
 * upgrade. Deterministic and increasing, no randomness. */
export const WORKBENCH_UPGRADE_COSTS = [10, 20, 30];

/** Firewood/forage yielded per chop/forage click scales with workbenchLevel
 * — the workbench's one real capability unlock (see planning/02-base-camp-
 * animations.md): a better-equipped workbench means a better axe/basket,
 * not just a bigger number. Level 0 (no upgrades bought) yields the base 1
 * unit; each level adds 1 more, so a fully upgraded workbench
 * (WORKBENCH_MAX_LEVEL) yields 4 per click. This only speeds up explicit,
 * real one-click-per-grant actions — not a passive/timer-based reward — so
 * it doesn't touch rewards-retention.md's "resist idle timers" rule. */
export function gatheringYield(workbenchLevel: number): number {
  return workbenchLevel + 1;
}

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
  async arrive(
    userId: string,
    characterId: string,
  ): Promise<{ firstArrival: boolean; character: Character }> {
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
   * yet) — each call adds firewood scaled by the workbench's gathering
   * yield (see gatheringYield). Uses an atomic increment rather than
   * read-then-write so rapid clicks can't race and drop a chop; the
   * character is still fetched first since the increment amount depends on
   * its current workbenchLevel. */
  async chopTree(userId: string, characterId: string): Promise<Character> {
    const character = await this.findOwned(userId, characterId);
    return this.prisma.character.update({
      where: { id: characterId },
      data: {
        firewoodCount: { increment: gatheringYield(character.workbenchLevel) },
      },
    });
  }

  /** Harvesting is an infinite ambient action (mirrors chopTree) — each
   * call adds forage scaled by the same workbench gathering yield. */
  async forage(userId: string, characterId: string): Promise<Character> {
    const character = await this.findOwned(userId, characterId);
    return this.prisma.character.update({
      where: { id: characterId },
      data: {
        forageCount: { increment: gatheringYield(character.workbenchLevel) },
      },
    });
  }

  /** Spends coins for a workbench upgrade. Already-maxed workbenches are
   * returned as-is (idempotent, same pattern as arrive()/quest resolution).
   * Throws BadRequestException — not silently ignored — when the character
   * can't afford the next level, so the frontend gets a real error to
   * surface rather than a false success. */
  async upgradeWorkbench(
    userId: string,
    characterId: string,
  ): Promise<Character> {
    const character = await this.findOwned(userId, characterId);

    if (character.workbenchLevel >= WORKBENCH_MAX_LEVEL) {
      return character;
    }

    const cost = WORKBENCH_UPGRADE_COSTS[character.workbenchLevel];
    if (character.coins < cost) {
      throw new BadRequestException(
        'Not enough coins for the next workbench upgrade',
      );
    }

    // A spend, not a grant — recorded with negative coins so summing the
    // ledger reconciles against Character.coins. A rewards-only ledger
    // would drift the moment anyone spent anything.
    const [upgraded] = await this.prisma.$transaction([
      this.prisma.character.update({
        where: { id: characterId },
        data: { coins: { decrement: cost }, workbenchLevel: { increment: 1 } },
      }),
      this.prisma.rewardEntry.create({
        data: rewardEntryData({
          characterId,
          category: RewardCategory.WORKBENCH_UPGRADE,
          coins: -cost,
          sourceId: characterId,
        }),
      }),
    ]);
    return upgraded;
  }

  private async findOwned(
    userId: string,
    characterId: string,
  ): Promise<Character> {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, userId },
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return character;
  }
}
