jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    carbonLog: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));
jest.mock('@/lib/redis', () => ({
  redisGet: jest.fn().mockResolvedValue(null),
  redisSet: jest.fn().mockResolvedValue(undefined),
}));

import { GET } from '@/app/api/community/leaderboard/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGroupBy = prisma.carbonLog.groupBy as jest.Mock;
const mockAggregate = prisma.carbonLog.aggregate as jest.Mock;

const mockSession = {
  user: { id: 'user-abc', email: 'test@test.com', name: 'Test' },
  expires: '2099-01-01',
};

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/community/leaderboard');
}

describe('GET /api/community/leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGroupBy.mockResolvedValue([
      { userId: 'user-abc', _sum: { totalCarbon: 42.5 } },
      { userId: 'user-xyz', _sum: { totalCarbon: 28.3 } },
    ]);
    mockAggregate.mockResolvedValue({
      _sum: { surfaceCarbon: 20, shadowCarbon: 15, ghostCarbon: 7.5 },
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns leaderboard entries for authenticated user', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.entries).toBeDefined();
    expect(json.data.updatedAt).toBeDefined();
  });

  it('returns empty entries when no data exists', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockGroupBy.mockResolvedValue([]);
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.entries).toHaveLength(0);
  });

  it('never exposes real user IDs in response', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const res = await GET(makeRequest());
    const json = await res.json();
    const responseText = JSON.stringify(json);
    expect(responseText).not.toContain('user-abc');
    expect(responseText).not.toContain('user-xyz');
  });

  it('marks current user entry with isCurrentUser flag', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const res = await GET(makeRequest());
    const json = await res.json();
    const currentUserEntry = json.data.entries.find(
      (e: { isCurrentUser?: boolean }) => e.isCurrentUser === true
    );
    expect(currentUserEntry).toBeDefined();
  });
});
