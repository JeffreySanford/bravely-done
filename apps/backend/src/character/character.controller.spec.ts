import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { Role } from '../generated/prisma/enums';

describe('CharacterController', () => {
  const user = { sub: 'user-1', role: Role.PLAYER, iat: 0, exp: 0 };
  const character = { id: 'char-1', userId: 'user-1', name: 'Ember Scout', createdAt: new Date(), updatedAt: new Date() };

  function buildController() {
    const characters = {
      create: jest.fn().mockResolvedValue(character),
      listForUser: jest.fn().mockResolvedValue([character]),
    } as unknown as CharacterService;
    return { controller: new CharacterController(characters), characters };
  }

  it('create delegates to the service with the current user and returns the public shape', async () => {
    const { controller, characters } = buildController();

    const result = await controller.create(user, { name: 'Ember Scout' });

    expect(characters.create).toHaveBeenCalledWith('user-1', { name: 'Ember Scout' });
    expect(result).toEqual({ id: character.id, name: character.name, createdAt: character.createdAt });
  });

  it('list returns the current user\'s characters in the public shape', async () => {
    const { controller, characters } = buildController();

    const result = await controller.list(user);

    expect(characters.listForUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([{ id: character.id, name: character.name, createdAt: character.createdAt }]);
  });
});
