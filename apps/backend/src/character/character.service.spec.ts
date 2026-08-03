import { PrismaService } from '../prisma/prisma.service';
import { CharacterService } from './character.service';

function buildPrismaMock() {
  return {
    character: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

describe('CharacterService', () => {
  let service: CharacterService;
  let prisma: ReturnType<typeof buildPrismaMock>;

  beforeEach(() => {
    prisma = buildPrismaMock();
    service = new CharacterService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a character owned by the given user', async () => {
      const created = { id: 'char-1', userId: 'user-1', name: 'Ember Scout', createdAt: new Date(), updatedAt: new Date() };
      prisma.character.create.mockResolvedValue(created);

      const result = await service.create('user-1', { name: 'Ember Scout' });

      expect(result).toEqual(created);
      expect(prisma.character.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', name: 'Ember Scout' },
      });
    });
  });

  describe('listForUser', () => {
    it('returns characters owned by the given user, oldest first', async () => {
      const characters = [{ id: 'char-1', userId: 'user-1', name: 'A', createdAt: new Date(), updatedAt: new Date() }];
      prisma.character.findMany.mockResolvedValue(characters);

      const result = await service.listForUser('user-1');

      expect(result).toEqual(characters);
      expect(prisma.character.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
