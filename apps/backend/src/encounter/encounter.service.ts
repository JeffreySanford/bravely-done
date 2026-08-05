import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Character, Encounter, EncounterStatus, Quest } from '../generated/prisma/client';
import { CreateEncounterDto } from './dto/create-encounter.dto';

/** Deterministic, flat reward for completing a small actionable step within
 * a quest — "Courage XP for beginning avoided work" (documentation/product/
 * rewards-retention.md's reward categories), its own category alongside
 * QuestService.QUEST_XP_REWARD and SprintService.FOCUS_XP_REWARD, all
 * adding to the same Character.xp counter (see schema.prisma). Smaller than
 * either — an encounter is a small step, not a full quest or a sustained
 * focus session. */
export const COURAGE_XP_REWARD = 5;

type OwnedEncounter = Encounter & { quest: Quest & { character: Character } };

@Injectable()
export class EncounterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, questId: string, dto: CreateEncounterDto): Promise<Encounter> {
    await this.findOwnedQuest(userId, questId);
    return this.prisma.encounter.create({
      data: { questId, title: dto.title },
    });
  }

  async listForQuest(userId: string, questId: string): Promise<Encounter[]> {
    await this.findOwnedQuest(userId, questId);
    return this.prisma.encounter.findMany({
      where: { questId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Completing an encounter never gates or auto-triggers quest completion
   * — it's purely a checklist item with its own small reward, independent
   * of the quest's own Complete/Retreat resolution (same "independent"
   * relationship Sprints already have to their quest). Already-completed
   * encounters are returned as-is without granting the reward again, same
   * idempotent pattern as quest/sprint completion. */
  async complete(userId: string, encounterId: string): Promise<{ encounter: Encounter; character: Character }> {
    const encounter = await this.findOwnedEncounter(userId, encounterId);

    if (encounter.status === EncounterStatus.COMPLETED) {
      const { quest, ...rest } = encounter;
      return { encounter: rest, character: quest.character };
    }

    const [completedEncounter, character] = await this.prisma.$transaction([
      this.prisma.encounter.update({
        where: { id: encounterId },
        data: { status: EncounterStatus.COMPLETED, completedAt: new Date() },
      }),
      this.prisma.character.update({
        where: { id: encounter.quest.characterId },
        data: { xp: { increment: COURAGE_XP_REWARD } },
      }),
    ]);

    return { encounter: completedEncounter, character };
  }

  private async findOwnedEncounter(userId: string, encounterId: string): Promise<OwnedEncounter> {
    const encounter = await this.prisma.encounter.findFirst({
      where: { id: encounterId, quest: { character: { userId } } },
      include: { quest: { include: { character: true } } },
    });
    if (!encounter) {
      throw new NotFoundException('Encounter not found');
    }
    return encounter;
  }

  private async findOwnedQuest(userId: string, questId: string): Promise<Quest & { character: Character }> {
    const quest = await this.prisma.quest.findFirst({
      where: { id: questId, character: { userId } },
      include: { character: true },
    });
    if (!quest) {
      throw new NotFoundException('Quest not found');
    }
    return quest;
  }
}
