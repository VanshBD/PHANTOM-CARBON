jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    carbonLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { GET } from '@/app/api/carbon/history/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockFindMany = prisma.carbonLog.findMany as jest.Mock;
const mockCount = prisma.carbonLog.count as jest.Mock;

const mockSession = {
  user: { id: 'user-id', email: 'test@test.com', name: 'Test' },
  expires: '2099-01-01',
};

const mockLogs = [
  {
    id: 'log-1',
    inputText: 'Drove to work',
    inputType: 'CHAT',
    surfaceCarbon: 2.1,
    shadowCarbon: 0,
    ghostCarbon: 0,
    totalCarbon: 2.1,
    breakdown: { transport: 2.1 },
    createdAt: new Date('2026-06-15'),
  },
];

function makeRequest(params = ''): NextRequest {
  return new NextRequest(`http://localhost/api/carbon/history${params}`);
}

describe('GET /api/carbon/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue(mockLogs);
    mockCount.mockResolvedValue(1);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns paginated logs for authenticated user', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const res = await GET(makeRequest('?page=1&limit=20'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.hasNext).toBe(false);
    expect(json.hasPrev).toBe(false);
  });

  it('returns 400 for invalid page param', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const res = await GET(makeRequest('?page=0&limit=20'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for limit exceeding 100', async () => {
    mockAuth.mockResolvedValue(mockSession);
    const res = await GET(makeRequest('?page=1&limit=101'));
    expect(res.status).toBe(400);
  });

  it('uses default pagination when no params provided', async () => {
    mockAuth.mockResolvedValue(mockSession);
    await GET(makeRequest());
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });

  it('calculates correct skip for page 2', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockCount.mockResolvedValue(25);
    mockFindMany.mockResolvedValue(mockLogs);
    await GET(makeRequest('?page=2&limit=20'));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    );
  });

  it('returns hasNext=true when more pages exist', async () => {
    mockAuth.mockResolvedValue(mockSession);
    mockCount.mockResolvedValue(25);
    mockFindMany.mockResolvedValue(mockLogs);
    const res = await GET(makeRequest('?page=1&limit=20'));
    const json = await res.json();
    expect(json.hasNext).toBe(true);
  });
});
