import Redis from 'ioredis';

// Singleton Redis client
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('connect', () => {
    console.info('[Redis] Connected successfully');
  });

  client.on('reconnecting', () => {
    console.warn('[Redis] Reconnecting...');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Helper: get value with graceful fallback
export async function redisGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch (err) {
    console.error('[Redis] GET error for key:', key, err);
    return null;
  }
}

// Helper: set value with TTL and graceful fallback
export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (err) {
    console.error('[Redis] SET error for key:', key, err);
  }
}

// Helper: delete key
export async function redisDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[Redis] DEL error for key:', key, err);
  }
}
