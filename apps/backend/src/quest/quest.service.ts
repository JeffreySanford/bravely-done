import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Character, Quest, QuestStatus } from '../generated/prisma/client';
import { CreateQuestDto } from './dto/create-quest.dto';

/** Bridge is fully repaired once this many quests have been completed. */
export const MAX_CONSTRUCTION_STAGE = 3;

@Injectable()
export class QuestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, characterId: string, dto: CreateQuestDto): Promise<Quest> {
    await this.findOwnedCharacter(userId, characterId);
    return this.prisma.quest.create({
      data: { characterId, title: dto.title },
    });
  }

  async listForCharacter(userId: string, characterId: string): Promise<Quest[]> {
    await this.findOwnedCharacter(userId, characterId);
    return this.prisma.quest.findMany({
      where: { characterId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Completes an open quest and advances the owning character's bridge
   * construction stage by one, capped at MAX_CONSTRUCTION_STAGE. Already-
   * completed quests are returned as-is without advancing the stage again. */
  async complete(userId: string, questId: string): Promise<{ quest: Quest; character: Character }> {
    const quest = await this.prisma.quest.findFirst({
      where: { id: questId, character: { userId } },
      include: { character: true },
    });
    if (!quest) {
      throw new NotFoundException('Quest not found');
    }

    if (quest.status === QuestStatus.COMPLETED) {
      const { character, ...rest } = quest;
      return { quest: rest, character };
    }

    const completedQuest = await this.prisma.quest.update({
      where: { id: questId },
      data: { status: QuestStatus.COMPLETED, completedAt: new Date() },
    });

    const nextStage = Math.min(quest.character.campConstructionStage + 1, MAX_CONSTRUCTION_STAGE);
    const character = await this.prisma.character.update({
      where: { id: quest.characterId },
      data: { campConstructionStage: nextStage },
    });

    return { quest: completedQuest, character };
  }

  private async findOwnedCharacter(userId: string, characterId: string): Promise<Character> {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, userId },
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return character;
  }
}
