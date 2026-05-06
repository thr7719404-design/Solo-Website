import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Liveness probe — process is up. Used by orchestrators to decide on restart.
   */
  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => ({
        process: { status: 'up', uptime: process.uptime() },
      }),
    ]);
  }

  /**
   * Readiness probe — dependencies (DB) reachable. Used by load balancers.
   */
  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return { database: { status: 'up' } };
        } catch (err: any) {
          return { database: { status: 'down', message: err?.message || 'unknown' } };
        }
      },
    ]);
  }

  /**
   * Backwards-compatible simple health.
   */
  @Get()
  basic() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
