import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { Role } from '../generated/prisma/enums';

describe('CharacterController', () => {
  const user = { sub: 'user-1', role: Role.PLAYER, iat: 0, exp: 0 };
  const character = {
    id: 'char-1',
    userId: 'user-1',
    name: 'Ember Scout',
    createdAt: new Date(),
    updatedAt: new Date(),
    hasArrivedAtCamp: false,
    campConstructionStage: 0,
    firewoodCount: 0,
  };

  function buildController() {
    const characters = {
      create: jest.fn().mockResolvedValue(character),
      listForUser: jest.fn().mockResolvedValue([character]),
      arrive: jest.fn().mockResolvedValue({ firstArrival: true, character }),
      chopTree: jest.fn().mockResolvedValue({ ...character, firewoodCount: 1 }),
    } as unknown as CharacterService;
    return { controller: new CharacterController(characters), characters };
  }

  const publicShape = {
    id: character.id,
    name: character.name,
    createdAt: character.createdAt,
    hasArrivedAtCamp: character.hasArrivedAtCamp,
    campConstructionStage: character.campConstructionStage,
    firewoodCount: character.firewoodCount,
  };

  it('create delegates to the service with the current user and returns the public shape', async () => {
    const { controller, characters } = buildController();

    const result = await controller.create(user, { name: 'Ember Scout' });

    expect(characters.create).toHaveBeenCalledWith('user-1', { name: 'Ember Scout' });
    expect(result).toEqual(publicShape);
  });

  it('list returns the current user\'s characters in the public shape', async () => {
    const { controller, characters } = buildController();

    const result = await controller.list(user);

    expect(characters.listForUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([publicShape]);
  });

  it('arrive delegates to the service and returns firstArrival plus the public shape', async () => {
    const { controller, characters } = buildController();

    const result = await controller.arrive(user, 'char-1');

    expect(characters.arrive).toHaveBeenCalledWith('user-1', 'char-1');
    expect(result).toEqual({ firstArrival: true, character: publicShape });
  });

  it('chopTree delegates to the service and returns the public shape', async () => {
    const { controller, characters } = buildController();

    const result = await controller.chopTree(user, 'char-1');

    expect(characters.chopTree).toHaveBeenCalledWith('user-1', 'char-1');
    expect(result).toEqual({ ...publicShape, firewoodCount: 1 });
  });
});
