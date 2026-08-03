import { Test } from '@nestjs/testing';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { CharacterModule } from './character.module';
import { CharacterService } from './character.service';

describe('CharacterModule', () => {
  it('provides CharacterService', async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule, CharacterModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(module.get(CharacterService)).toBeDefined();
  });
});
