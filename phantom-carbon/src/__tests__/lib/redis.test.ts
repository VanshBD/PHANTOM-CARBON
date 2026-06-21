/**
 * Redis helper function tests
 * Tests redisGet, redisSet, redisDel with a mocked ioredis client
 */

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    get:   jest.fn(),
    set:   jest.fn(),
    del:   jest.fn(),
    on:    jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      incr: jest.fn().mockReturnThis(),
      ttl:  jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 1], [null, 59]]),
    }),
    expire: jest.fn().mockResolvedValue(1),
  }))
);

import { redisGet, redisSet, redisDel, redis } from '@/lib/redis';

describe('Redis helpers', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('redisGet', () => {
    it('returns value when key exists', async () => {
      (redis.get as jest.Mock).mockResolvedValue('{"test":true}');
      const result = await redisGet('test-key');
      expect(result).toBe('{"test":true}');
    });

    it('returns null when key does not exist', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      const result = await redisGet('missing-key');
      expect(result).toBeNull();
    });

    it('returns null and logs error when Redis throws', async () => {
      (redis.get as jest.Mock).mockRejectedValue(new Error('Redis down'));
      const result = await redisGet('error-key');
      expect(result).toBeNull();
    });
  });

  describe('redisSet', () => {
    it('sets value with TTL', async () => {
      (redis.set as jest.Mock).mockResolvedValue('OK');
      await redisSet('key', 'value', 3600);
      expect(redis.set).toHaveBeenCalledWith('key', 'value', 'EX', 3600);
    });

    it('does not throw when Redis is unavailable', async () => {
      (redis.set as jest.Mock).mockRejectedValue(new Error('Redis down'));
      await expect(redisSet('key', 'value', 60)).resolves.not.toThrow();
    });
  });

  describe('redisDel', () => {
    it('deletes a key', async () => {
      (redis.del as jest.Mock).mockResolvedValue(1);
      await redisDel('delete-me');
      expect(redis.del).toHaveBeenCalledWith('delete-me');
    });

    it('does not throw on error', async () => {
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis down'));
      await expect(redisDel('key')).resolves.not.toThrow();
    });
  });
});
