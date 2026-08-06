import { HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  function buildController(health: {
    status: 'ok' | 'error';
    database: 'ok' | 'error';
  }) {
    const service = {
      check: jest.fn().mockResolvedValue({ ...health, checkedAt: new Date() }),
    };
    const res = {
      status: jest.fn().mockReturnThis(),
    } as unknown as FastifyReply;
    return {
      controller: new HealthController(service as unknown as HealthService),
      service,
      res,
    };
  }

  it('returns 200 and the health shape when every dependency is reachable', async () => {
    const { controller, res } = buildController({
      status: 'ok',
      database: 'ok',
    });

    const result = await controller.check(res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(result).toEqual(
      expect.objectContaining({ status: 'ok', database: 'ok' }),
    );
  });

  it('returns 503 (not 500) when a dependency is unreachable, so a probe can pull the instance from rotation', async () => {
    const { controller, res } = buildController({
      status: 'error',
      database: 'error',
    });

    const result = await controller.check(res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(result).toEqual(
      expect.objectContaining({ status: 'error', database: 'error' }),
    );
  });
});
