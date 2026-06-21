jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: { carbonLog: { findMany: jest.fn() } },
}));
jest.mock('@/lib/redis', () => ({
  redisGet: jest.fn(),
  redisSet: jest.fn(),
}));

import { GET } from '@/app/api/carbon/summary/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redisGet, redisSet } from '@/lib/redis';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockFindMany = prisma.carbonLog.findMany as jest.Mock;
const mockRedisGet = redisGet as jest.MockedFunction<typeof redisGet>;
const mockRedisSet = redisSet as jest.MockedFunction<typeof redisSet>;

const mockSession = {
  user: { id: 'user-id', email: 'test@test.com', name: 'Test' },
  expires: '2099-01-01',
};

function makeRequest(period = '7d'): NextRequest {
  return new NextRequest(`http://localhost/api/carbon/summary?period=${period}`);
}

describe('GET /api/carbon/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid period', async () => {
    const res = await GET(makeRequest('1y'));
    expect(res.status).toBe(400);
  });

  it('returns cached summary on cache hit', async () => {
    const cached = { period: '7d', totalCarbon: 42, totalSurface: 10, totalShadow: 20, totalGhost: 12 };
    mockRedisGet.mockResolvedValue(JSON.stringify(cached));

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.totalCarbon).toBe(42);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('returns empty summary when user has no logs', async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.totalCarbon).toBe(0);
    expect(json.data.trend).toBe('stable');
  });

  it('aggregates logs and caches the result', async () => {
    mockFindMany.mockResolvedValue([
      {
        surfaceCarbon: 2,
        shadowCarbon: 1,
        ghostCarbon: 0.5,
        totalCarbon: 3.5,
        breakdown: { transport: 2 },
        createdAt: new Date('2026-06-01'),
        rawAiResponse: null,
      },
    ]);

    const res = await GET(makeRequest('30d'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.period).toBe('30d');
    expect(json.data.totalCarbon).toBe(3.5);
    expect(mockRedisSet).toHaveBeenCalled();
  });

  it('continues when Redis cache read fails', async () => {
    mockRedisGet.mockRejectedValue(new Error('Redis down'));
    mockFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });
});
