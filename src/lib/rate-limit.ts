import { redis } from '@/lib/redis';
import type { RateLimitResult } from '@/types';

/**
 * Sliding window rate limiter using Redis INCR + EXPIRE
 *
 * @param userId  - The authenticated user's ID
 * @param endpoint - Identifier for the endpoint (e.g. 'carbon:extract')
 * @param max     - Maximum number of requests allowed in the window
 * @param windowSeconds - Window size in seconds
 */
export async function rateLimit(
  userId: string,
  endpoint: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${endpoint}:${userId}`;

  try {
    // Use pipeline for atomic INCR + EXPIRE
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      // Redis unavailable — fail open to avoid blocking users
      return { allowed: true, remaining: max };
    }

    const count = results[0][1] as number;
    const ttl = results[1][1] as number;

    // Set expiry only on first request in window
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    const remaining = Math.max(0, max - count);
    const allowed = count <= max;

    return {
      allowed,
      remaining,
      retryAfter: allowed ? undefined : (ttl > 0 ? ttl : windowSeconds),
    };
  } catch (err) {
    console.error('[RateLimit] Redis error — failing open:', err);
    // Fail open: if Redis is down, allow request to avoid blocking users
    return { allowed: true, remaining: max };
  }
}

// Pre-configured rate limiters for each endpoint
export const rateLimiters = {
  carbonExtract: (userId: string) => rateLimit(userId, 'carbon:extract', 10, 60),
  carbonUpload: (userId: string) => rateLimit(userId, 'carbon:upload', 5, 60),
  oracleGenerate: (userId: string) => rateLimit(userId, 'oracle:generate', 2, 3600),
};
