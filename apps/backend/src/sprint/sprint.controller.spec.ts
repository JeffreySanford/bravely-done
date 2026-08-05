import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';
import { Role, SprintStatus } from '../generated/prisma/enums';

describe('SprintController', () => {
  const user = { sub: 'user-1', role: Role.PLAYER, iat: 0, exp: 0 };
  const sprint = {
    id: 'sprint-1',
    questId: 'quest-1',
    targetSeconds: 900,
    startedAt: new Date(),
    pausedAt: null,
    pausedSeconds: 0,
    status: SprintStatus.ACTIVE,
    completedAt: null,
    createdAt: new Date(),
  };
  const character = {
    id: 'char-1',
    name: 'Ember Scout',
    createdAt: new Date(),
    hasArrivedAtCamp: true,
    campConstructionStage: 1,
    firewoodCount: 0,
    forageCount: 0,
    xp: 15,
    coins: 0,
  };

  function buildController() {
    const sprints = {
      start: jest.fn().mockResolvedValue(sprint),
      listForQuest: jest.fn().mockResolvedValue([sprint]),
      pause: jest.fn().mockResolvedValue({ ...sprint, status: SprintStatus.PAUSED, pausedAt: new Date() }),
      resume: jest.fn().mockResolvedValue({ ...sprint, status: SprintStatus.ACTIVE }),
      complete: jest.fn().mockResolvedValue({ sprint: { ...sprint, status: SprintStatus.COMPLETED }, character }),
    } as unknown as SprintService;
    return { controller: new SprintController(sprints), sprints };
  }

  const publicSprintShape = {
    id: sprint.id,
    questId: sprint.questId,
    targetSeconds: sprint.targetSeconds,
    startedAt: sprint.startedAt,
    pausedAt: sprint.pausedAt,
    pausedSeconds: sprint.pausedSeconds,
    status: sprint.status,
    completedAt: sprint.completedAt,
    createdAt: sprint.createdAt,
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

  it('start delegates to the service and returns the public shape', async () => {
    const { controller, sprints } = buildController();

    const result = await controller.start(user, 'quest-1', { targetSeconds: 900 });

    expect(sprints.start).toHaveBeenCalledWith('user-1', 'quest-1', { targetSeconds: 900 });
    expect(result).toEqual(publicSprintShape);
  });

  it("list returns the quest's sprints in the public shape", async () => {
    const { controller, sprints } = buildController();

    const result = await controller.list(user, 'quest-1');

    expect(sprints.listForQuest).toHaveBeenCalledWith('user-1', 'quest-1');
    expect(result).toEqual([publicSprintShape]);
  });

  it('pause delegates to the service and returns the public shape', async () => {
    const { controller, sprints } = buildController();

    const result = await controller.pause(user, 'sprint-1');

    expect(sprints.pause).toHaveBeenCalledWith('user-1', 'sprint-1');
    expect(result.status).toBe(SprintStatus.PAUSED);
  });

  it('resume delegates to the service and returns the public shape', async () => {
    const { controller, sprints } = buildController();

    const result = await controller.resume(user, 'sprint-1');

    expect(sprints.resume).toHaveBeenCalledWith('user-1', 'sprint-1');
    expect(result.status).toBe(SprintStatus.ACTIVE);
  });

  it('complete delegates to the service and returns both public shapes', async () => {
    const { controller, sprints } = buildController();

    const result = await controller.complete(user, 'sprint-1');

    expect(sprints.complete).toHaveBeenCalledWith('user-1', 'sprint-1');
    expect(result).toEqual({
      sprint: { ...publicSprintShape, status: SprintStatus.COMPLETED },
      character: publicCharacterShape,
    });
  });
});
