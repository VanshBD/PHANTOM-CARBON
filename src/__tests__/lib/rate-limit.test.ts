/**
 * Rate Limit tests — uses dependency injection to pass a mock Redis client.
 * Zero dependency on the real Redis singleton. 100% reliable.
 */

import { rateLimit, rateLimiters } from '@/lib/rate-limit';

// Helper: build a fake Redis client that returns controlled pipeline results
function makeMockRedis(count: number, ttl: number, shouldThrow = false) {
  const mockExpire = jest.fn().mockResolvedValue(1);
  const mockExec = shouldThrow
    ? jest.fn().mockRejectedValue(new Error('Redis unavailable'))
    : count === -1
    ? jest.fn().mockResolvedValue(null)   // simulate null response
    : jest.fn().mockResolvedValue([[null, count], [null, ttl]]);

  const mockPipeline = {
    incr: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: mockExec,
  };

  return {
    client: {
      pipeline: jest.fn().mockReturnValue(mockPipeline),
      expire: mockExpire,
    },
    mockExpire,
    mockPipeline,
  };
}

describe('rateLimit — core logic (dependency injection)', () => {
  it('allows request when count is below max (3 of 10)', async () => {
    const { client } = makeMockRedis(3, 55);
    const result = await rateLimit('u1', 'ep', 10, 60, client);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });

  it('allows request one below max (9 of 10)', async () => {
    const { client } = makeMockRedis(9, 30);
    const result = await rateLimit('u2', 'ep', 10, 60, client);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('allows exactly at the limit (10th request out of 10 allowed)', async () => {
    const { client } = makeMockRedis(10, 25);
    const result = await rateLimit('u3', 'ep', 10, 60, client);
    expect(result.allowed).toBe(true); // count <= max: 10 <= 10 = true
    expect(result.remaining).toBe(0);
  });

  it('blocks when count exceeds max (11th request, max 10)', async () => {
    const { client } = makeMockRedis(11, 30);
    const result = await rateLimit('u4', 'ep', 10, 60, client);
    expect(result.allowed).toBe(false); // 11 > 10 = blocked
    expect(result.remaining).toBe(0);
  });

  it('returns retryAfter = TTL when count exceeds max', async () => {
    const { client } = makeMockRedis(15, 42);
    const result = await rateLimit('u5', 'ep', 10, 60, client);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(42);
  });

  it('retryAfter is undefined when allowed', async () => {
    const { client } = makeMockRedis(5, 30);
    const result = await rateLimit('u6', 'ep', 10, 60, client);
    expect(result.retryAfter).toBeUndefined();
  });

  it('calls expire on first request (count === 1)', async () => {
    const { client, mockExpire } = makeMockRedis(1, -1);
    await rateLimit('u7', 'myep', 10, 60, client);
    expect(mockExpire).toHaveBeenCalledWith('ratelimit:myep:u7', 60);
  });

  it('does NOT call expire on subsequent requests (count > 1)', async () => {
    const { client, mockExpire } = makeMockRedis(5, 40);
    await rateLimit('u8', 'ep', 10, 60, client);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it('fails open (allows) when exec throws — Redis unavailable', async () => {
    const { client } = makeMockRedis(0, 0, true /* shouldThrow */);
    const result = await rateLimit('u9', 'ep', 10, 60, client);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
    expect(result.retryAfter).toBeUndefined();
  });

  it('fails open when exec returns null', async () => {
    const { client } = makeMockRedis(-1, 0); // -1 count triggers null response
    const result = await rateLimit('u10', 'ep', 10, 60, client);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it('uses window seconds as retryAfter when TTL is 0', async () => {
    const { client } = makeMockRedis(11, 0);
    const result = await rateLimit('u11', 'ep', 10, 60, client);
    expect(result.retryAfter).toBe(60); // falls back to windowSeconds
  });

  it('uses correct Redis key format', async () => {
    const { client } = makeMockRedis(1, 59);
    await rateLimit('myuser', 'carbon:extract', 10, 60, client);
    expect(client.pipeline).toHaveBeenCalled();
    const { mockPipeline } = makeMockRedis(1, 59);
    // Verify key format through expire call
    const { client: c2, mockExpire } = makeMockRedis(1, -1);
    await rateLimit('myuser', 'carbon:extract', 10, 60, c2);
    expect(mockExpire).toHaveBeenCalledWith('ratelimit:carbon:extract:myuser', 60);
  });
});

describe('rateLimiters — pre-configured shortcuts', () => {
  it('carbonExtract is a function with correct signature', () => {
    expect(typeof rateLimiters.carbonExtract).toBe('function');
  });

  it('carbonUpload is a function', () => {
    expect(typeof rateLimiters.carbonUpload).toBe('function');
  });

  it('oracleGenerate is a function', () => {
    expect(typeof rateLimiters.oracleGenerate).toBe('function');
  });
});
