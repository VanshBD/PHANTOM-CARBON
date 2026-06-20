// Mock all external dependencies
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    carbonExtract: jest.fn(),
  },
}));

jest.mock('@/services/aiExtractor', () => ({
  extractCarbonFromText: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    carbonLog: {
      create: jest.fn(),
    },
  },
}));

import { POST } from '@/app/api/carbon/extract/route';
import { auth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { extractCarbonFromText } from '@/services/aiExtractor';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockRateLimit = rateLimiters.carbonExtract as jest.MockedFunction<typeof rateLimiters.carbonExtract>;
const mockExtract = extractCarbonFromText as jest.MockedFunction<typeof extractCarbonFromText>;
const mockPrismaCreate = prisma.carbonLog.create as jest.MockedFunction<typeof prisma.carbonLog.create>;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/carbon/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockSession = {
  user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
  expires: '2099-01-01',
};

const mockExtraction = {
  surfaceCarbon: 2.1,
  shadowCarbon: 0,
  ghostCarbon: 0,
  totalCarbon: 2.1,
  breakdown: { transport: 2.1 },
  confidence: 0.9,
  sources: ['Car journey'],
  summary: 'You drove today',
  topAction: 'Try cycling',
};

describe('POST /api/carbon/extract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    mockExtract.mockResolvedValue(mockExtraction);
    mockPrismaCreate.mockResolvedValue({
      id: 'log-123',
      createdAt: new Date(),
      surfaceCarbon: 2.1,
      shadowCarbon: 0,
      ghostCarbon: 0,
      totalCarbon: 2.1,
    } as never);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ text: 'I drove to work', inputType: 'CHAT' }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toContain('Authentication');
  });

  it('returns 400 when text is too short', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const res = await POST(makeRequest({ text: 'short', inputType: 'CHAT' }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain('Validation');
  });

  it('returns 400 when text is too long (> 2000 chars)', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const res = await POST(makeRequest({ text: 'a'.repeat(2001), inputType: 'CHAT' }));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 45 });

    const res = await POST(makeRequest({ text: 'I drove 10km to work today', inputType: 'CHAT' }));
    expect(res.status).toBe(429);

    const retryAfter = res.headers.get('Retry-After');
    expect(retryAfter).toBe('45');
  });

  it('returns 200 with extraction on valid input', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const res = await POST(makeRequest({ text: 'I drove 10km to work today in my car', inputType: 'CHAT' }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.extraction.totalCarbon).toBeCloseTo(2.1);
    expect(json.data.logId).toBe('log-123');
  });

  it('saves CarbonLog to database on success', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    await POST(makeRequest({ text: 'I drove 10km to work today in my car', inputType: 'CHAT' }));

    expect(mockPrismaCreate).toHaveBeenCalledTimes(1);
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'test-user-id',
          inputType: 'CHAT',
          totalCarbon: 2.1,
        }),
      })
    );
  });

  it('returns 400 for invalid JSON body', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const req = new NextRequest('http://localhost:3000/api/carbon/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
