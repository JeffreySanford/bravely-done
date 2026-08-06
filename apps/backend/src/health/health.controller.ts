import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { HealthDto } from './dto/health.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Deliberately unauthenticated — every other controller opts into
   * JwtAuthGuard explicitly, and a probe that needs credentials can't be
   * used by a load balancer or an uptime monitor. Nothing here leaks
   * anything an unauthenticated caller couldn't already infer by watching
   * whether the API responds at all. */
  @Get()
  @ApiOperation({ summary: 'Liveness and dependency readiness check' })
  @ApiOkResponse({
    type: HealthDto,
    description: 'Every dependency is reachable.',
  })
  @ApiServiceUnavailableResponse({
    type: HealthDto,
    description: 'At least one dependency is unreachable.',
  })
  async check(
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<HealthDto> {
    const health = await this.health.check();
    // 503 (not 500) on a failed dependency: the API itself answered fine,
    // it just can't serve traffic right now — which is exactly what a probe
    // needs to distinguish in order to pull an instance out of rotation
    // without treating it as a crash.
    res.status(
      health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );
    return health;
  }
}
