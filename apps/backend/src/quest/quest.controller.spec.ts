import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';
import { QuestStatus, Role } from '../generated/prisma/enums';

describe('QuestController', () => {
  const user = { sub: 'user-1', role: Role.PLAYER, iat: 0, exp: 0 };
  const quest = {
    id: 'quest-1',
    characterId: 'char-1',
    title: 'Answer three emails',
    status: QuestStatus.OPEN,
    createdAt: new Date(),
    completedAt: null,
  };
  const character = {
    id: 'char-1',
    userId: 'user-1',
    name: 'Ember Scout',
    createdAt: new Date(),
    updatedAt: new Date(),
    hasArrivedAtCamp: true,
    campConstructionStage: 1,
    firewoodCount: 0,
    forageCount: 0,
    xp: 20,
    coins: 10,
  };

  function buildController() {
    const quests = {
      create: jest.fn().mockResolvedValue(quest),
      listForCharacter: jest.fn().mockResolvedValue([quest]),
      start: jest.fn().mockResolvedValue({ ...quest, status: QuestStatus.IN_PROGRESS }),
      complete: jest.fn().mockResolvedValue({ quest: { ...quest, status: QuestStatus.COMPLETED }, character }),
      retreat: jest.fn().mockResolvedValue({ ...quest, status: QuestStatus.RETREATED }),
    } as unknown as QuestService;
    return { controller: new QuestController(quests), quests };
  }

  const publicQuestShape = {
    id: quest.id,
    characterId: quest.characterId,
    title: quest.title,
    status: quest.status,
    createdAt: quest.createdAt,
    completedAt: quest.completedAt,
  };

  const publicCharacterShape = {
    id: character.id,
    name: character.name,
    createdAt: character.createdAt,
    hasArrivedAtCamp: character.hasArrivedAtCamp,
    campConstructionStage: character.campConstructionStage,
    firewoodCount: character.firewoodCount,
    forageCount: character.forageCount,
    xp: character.xp,
    coins: character.coins,
  };

  it('create delegates to the service and returns the public shape', async () => {
    const { controller, quests } = buildController();

    const result = await controller.create(user, 'char-1', { title: 'Answer three emails' });

    expect(quests.create).toHaveBeenCalledWith('user-1', 'char-1', { title: 'Answer three emails' });
    expect(result).toEqual(publicQuestShape);
  });

  it('list returns the character\'s quests in the public shape', async () => {
    const { controller, quests } = buildController();

    const result = await controller.list(user, 'char-1');

    expect(quests.listForCharacter).toHaveBeenCalledWith('user-1', 'char-1');
    expect(result).toEqual([publicQuestShape]);
  });

  it('start delegates to the service and returns the public shape', async () => {
    const { controller, quests } = buildController();

    const result = await controller.start(user, 'quest-1');

    expect(quests.start).toHaveBeenCalledWith('user-1', 'quest-1');
    expect(result).toEqual({ ...publicQuestShape, status: QuestStatus.IN_PROGRESS });
  });

  it('complete delegates to the service and returns both public shapes', async () => {
    const { controller, quests } = buildController();

    const result = await controller.complete(user, 'quest-1');

    expect(quests.complete).toHaveBeenCalledWith('user-1', 'quest-1');
    expect(result).toEqual({
      quest: { ...publicQuestShape, status: QuestStatus.COMPLETED },
      character: publicCharacterShape,
    });
  });

  it('retreat delegates to the service and returns the public shape', async () => {
    const { controller, quests } = buildController();

    const result = await controller.retreat(user, 'quest-1');

    expect(quests.retreat).toHaveBeenCalledWith('user-1', 'quest-1');
    expect(result).toEqual({ ...publicQuestShape, status: QuestStatus.RETREATED });
  });
});
