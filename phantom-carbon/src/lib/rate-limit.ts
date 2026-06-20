import { redis as defaultRedis } from '@/lib/redis';
import type { RateLimitResult } from '@/types';

// Accept redis client as optional parameter — enables clean unit testing
type RedisLike = {
  pipeline: () => {
    incr: (key: string) => unknown;
    ttl: (key: string) => unknown;
    exec: () => Promise<Array<[Error | null, unknown]> | null>;
  };
  expire: (key: string, seconds: number) => Promise<number>;
};

/**
 * Sliding window rate limiter using Redis INCR + EXPIRE.
 * Accepts an optional redis client for dependency injection in tests.
 *
 * @param userId         - The authenticated user's ID
 * @param endpoint       - Endpoint identifier (e.g. 'carbon:extract')
 * @param max            - Max requests allowed in the window
 * @param windowSeconds  - Window size in seconds
 * @param redisClient    - Optional Redis client (defaults to singleton)
 * @returns              - { allowed, remaining, retryAfter? }
 */
export async function rateLimit(
  userId: string,
  endpoint: string,
  max: number,
  windowSeconds: number,
  redisClient: RedisLike = defaultRedis as unknown as RedisLike
): Promise<RateLimitResult> {
  const key = `ratelimit:${endpoint}:${userId}`;

  try {
    const pipeline = redisClient.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      return { allowed: true, remaining: max };
    }

    const count = results[0][1] as number;
    const ttl   = results[1][1] as number;

    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    const remaining = Math.max(0, max - count);
    const allowed   = count <= max;

    return {
      allowed,
      remaining,
      retryAfter: allowed ? undefined : (ttl > 0 ? ttl : windowSeconds),
    };
  } catch (err) {
    console.error('[RateLimit] Redis error — failing open:', err);
    return { allowed: true, remaining: max };
  }
}

// Pre-configured rate limiters for each endpoint
export const rateLimiters = {
  carbonExtract:  (userId: string) => rateLimit(userId, 'carbon:extract',  10,   60),
  carbonUpload:   (userId: string) => rateLimit(userId, 'carbon:upload',    5,   60),
  oracleGenerate: (userId: string) => rateLimit(userId, 'oracle:generate',  2, 3600),
};
