import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

/**
 * Redis-backed storage for @nestjs/throttler.
 * Replaces the default in-memory store so rate limits survive restarts
 * and work across horizontally-scaled instances.
 */
@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly prefix = 'throttle:';

  constructor(private readonly config: ConfigService) {
    const host = this.config.get('REDIS_HOST', 'localhost') as string;
    const port = Number(this.config.get('REDIS_PORT', 6379));
    const password = this.config.get('REDIS_PASSWORD') as string | undefined;
    const db = Number(this.config.get('REDIS_THROTTLE_DB', 1));
    const useTls = this.config.get('REDIS_TLS', 'false') === 'true' || port === 6380;
    this.redis = new Redis({
      host,
      port,
      password,
      db,
      ...(useTls ? { tls: {} } : {}),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 200, 2000),
    });
    this.redis.connect().catch(() => {
      // Connection failures are handled by ioredis retry strategy
    });
  }

  /**
   * Increment the hit count for `key` atomically. Redis INCR + TTL ensures
   * correctness even under concurrent requests from multiple instances.
   *
   * @param key   Unique throttle key (IP + route)
   * @param ttl   Time-to-live in milliseconds
   * @returns     { totalHits, timeToExpire (ms) }
   */
  async increment(
    key: string,
    ttl: number,
  ): Promise<{ totalHits: number; timeToExpire: number }> {
    const redisKey = `${this.prefix}${key}`;
    const ttlSeconds = Math.ceil(ttl / 1000);

    const totalHits = await this.redis.incr(redisKey);

    // Set expiry only on the first hit to avoid resetting the window
    if (totalHits === 1) {
      await this.redis.expire(redisKey, ttlSeconds);
    }

    const pttl = await this.redis.pttl(redisKey);
    const timeToExpire = pttl > 0 ? pttl : ttl;

    return { totalHits, timeToExpire };
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
