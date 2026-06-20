jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/rate-limit', () => ({
  rateLimiters: { oracleGenerate: jest.fn() },
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    carbonLog: { count: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
    oracleReport: { create: jest.fn() },
  },
}));
jest.mock('@/lib/redis', () => ({
  redisGet: jest.fn(),
  redisSet: jest.fn(),
}));
jest.mock('@/services/oracleService', () => ({
  generateScenarios: jest.fn(),
  getOracleCacheKey: jest.fn().mockReturnValue('oracle:user-id:2025:25'),
}));

import { POST } from '@/app/api/oracle/generate/route';
import { auth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { redisGet } from '@/lib/redis';
import { generateScenarios } from '@/services/oracleService';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockRateLimit = rateLimiters.oracleGenerate as jest.MockedFunction<typeof rateLimiters.oracleGenerate>;
const mockLogCount = prisma.carbonLog.count as jest.MockedFunction<typeof prisma.carbonLog.count>;
const mockLogFindMany = prisma.carbonLog.findMany as jest.MockedFunction<typeof prisma.carbonLog.findMany>;
const mockRedisGet = redisGet as jest.MockedFunction<typeof redisGet>;
const mockGenerateScenarios = generateScenarios as jest.MockedFunction<typeof generateScenarios>;

const mockSession = {
  user: { id: 'user-id', email: 'test@example.com', name: 'Test' },
  expires: '2099-01-01',
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/oracle/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/oracle/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 1 });
    mockRedisGet.mockResolvedValue(null);
    mockLogCount.mockResolvedValue(5);
    mockLogFindMany.mockResolvedValue([
      { surfaceCarbon: 3, shadowCarbon: 2, ghostCarbon: 1, totalCarbon: 6, breakdown: {} },
    ] as never);
    (prisma.oracleReport.create as jest.MockedFunction<typeof prisma.oracleReport.create>).mockResolvedValue({} as never);
    mockGenerateScenarios.mockResolvedValue({
      darkFuture: 'Dark future text',
      possibleFuture: 'Possible future text',
      phantomFuture: 'Phantom future text',
      weeklyCarbon: 42,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest({ city: 'Mumbai', country: 'India' }));
    expect(res.status).toBe(401);
  });

  it('returns 422 when fewer than 3 carbon logs', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockLogCount.mockResolvedValue(2);

    const res = await POST(makeRequest({ city: 'Mumbai', country: 'India' }));
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.logsRequired).toBe(3);
    expect(json.logsPresent).toBe(2);
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 3600 });

    const res = await POST(makeRequest({ city: 'Mumbai', country: 'India' }));
    expect(res.status).toBe(429);
  });

  it('returns 200 with scenarios on valid request', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const res = await POST(makeRequest({ city: 'Mumbai', country: 'India' }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.darkFuture).toBe('Dark future text');
    expect(json.cached).toBe(false);
  });

  it('returns cached result when available', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockRedisGet.mockResolvedValue(JSON.stringify({
      darkFuture: 'Cached dark',
      possibleFuture: 'Cached possible',
      phantomFuture: 'Cached phantom',
      weeklyCarbon: 60,
    }));

    const res = await POST(makeRequest({ city: 'Mumbai', country: 'India' }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.darkFuture).toBe('Cached dark');
    expect(json.cached).toBe(true);
    expect(mockGenerateScenarios).not.toHaveBeenCalled();
  });
});
