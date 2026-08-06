import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    service = new HealthService(prisma as unknown as PrismaService);
    // The failure path logs the underlying error on purpose; silence it so a
    // passing suite doesn't print a scary stack trace.
    jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);
  });

  it('reports ok when the database answers a real query', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await service.check();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('ok');
    expect(result.checkedAt).toBeInstanceOf(Date);
  });

  it('reports error without throwing when the database is unreachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    const result = await service.check();

    expect(result.status).toBe('error');
    expect(result.database).toBe('error');
  });

  it('does not treat a merely-constructed client as healthy — it runs a query every time', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await service.check();
    await service.check();

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });
});
