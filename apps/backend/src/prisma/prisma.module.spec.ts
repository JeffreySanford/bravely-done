import { Test } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  it('provides a connected PrismaService', async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    const service = module.get(PrismaService);
    expect(service).toBeDefined();
    expect(typeof service.onModuleInit).toBe('function');
    expect(typeof service.$connect).toBe('function');
  });
});
