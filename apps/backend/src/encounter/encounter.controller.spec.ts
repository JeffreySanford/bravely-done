import { EncounterController } from './encounter.controller';
import { EncounterService } from './encounter.service';
import { EncounterStatus, Role } from '../generated/prisma/enums';

describe('EncounterController', () => {
  const user = { sub: 'user-1', role: Role.PLAYER, iat: 0, exp: 0 };
  const encounter = {
    id: 'enc-1',
    questId: 'quest-1',
    title: 'Draft the reply',
    status: EncounterStatus.OPEN,
    createdAt: new Date(),
    completedAt: null,
  };
  const character = {
    id: 'char-1',
    name: 'Ember Scout',
    createdAt: new Date(),
    hasArrivedAtCamp: true,
    campConstructionStage: 1,
    firewoodCount: 0,
    forageCount: 0,
    xp: 5,
    coins: 0,
  };

  function buildController() {
    const encounters = {
      create: jest.fn().mockResolvedValue(encounter),
      listForQuest: jest.fn().mockResolvedValue([encounter]),
      complete: jest.fn().mockResolvedValue({ encounter: { ...encounter, status: EncounterStatus.COMPLETED }, character }),
    } as unknown as EncounterService;
    return { controller: new EncounterController(encounters), encounters };
  }

  const publicEncounterShape = {
    id: encounter.id,
    questId: encounter.questId,
    title: encounter.title,
    status: encounter.status,
    createdAt: encounter.createdAt,
    completedAt: encounter.completedAt,
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
    const { controller, encounters } = buildController();

    const result = await controller.create(user, 'quest-1', { title: 'Draft the reply' });

    expect(encounters.create).toHaveBeenCalledWith('user-1', 'quest-1', { title: 'Draft the reply' });
    expect(result).toEqual(publicEncounterShape);
  });

  it("list returns the quest's encounters in the public shape", async () => {
    const { controller, encounters } = buildController();

    const result = await controller.list(user, 'quest-1');

    expect(encounters.listForQuest).toHaveBeenCalledWith('user-1', 'quest-1');
    expect(result).toEqual([publicEncounterShape]);
  });

  it('complete delegates to the service and returns both public shapes', async () => {
    const { controller, encounters } = buildController();

    const result = await controller.complete(user, 'enc-1');

    expect(encounters.complete).toHaveBeenCalledWith('user-1', 'enc-1');
    expect(result).toEqual({
      encounter: { ...publicEncounterShape, status: EncounterStatus.COMPLETED },
      character: publicCharacterShape,
    });
  });
});
