import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthDto, HealthStatus } from './dto/health.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Liveness + dependency readiness in one call. The database check runs a
   * real trivial query rather than inspecting connection state: PrismaService
   * connects once at module init, so a client that has since lost its
   * connection (Postgres restarted, network partition, credentials rotated)
   * would still *look* connected. `SELECT 1` is the cheapest thing that
   * actually proves a round trip.
   *
   * Never throws — a health endpoint that 500s on a down dependency tells a
   * probe less than one that returns a structured "database: error", and it
   * makes the failure indistinguishable from the API itself being broken. */
  async check(): Promise<HealthDto> {
    const database = await this.checkDatabase();
    const dto = new HealthDto();
    dto.status = database === 'ok' ? 'ok' : 'error';
    dto.database = database;
    dto.checkedAt = new Date();
    return dto;
  }

  private async checkDatabase(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (error) {
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
      );
      return 'error';
    }
  }
}
