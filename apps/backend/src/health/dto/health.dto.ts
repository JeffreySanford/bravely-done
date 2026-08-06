import { ApiProperty } from '@nestjs/swagger';

export type HealthStatus = 'ok' | 'error';

export class HealthDto {
  /// 'ok' only when every checked dependency is reachable — a deliberately
  /// coarse single signal for load balancers and uptime checks, with the
  /// per-dependency detail below for humans debugging a red one.
  @ApiProperty({ enum: ['ok', 'error'] })
  status!: HealthStatus;

  /// Whether a real query reached Postgres (see HealthService.check) — not
  /// merely whether a connection object exists.
  @ApiProperty({ enum: ['ok', 'error'] })
  database!: HealthStatus;

  /// Server time at the moment of the check. Useful when correlating a
  /// failed probe against logs, and it makes an accidentally-cached
  /// health response obvious.
  @ApiProperty()
  checkedAt!: Date;
}
