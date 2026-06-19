jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/rate-limit', () => ({
  rateLimiters: { carbonUpload: jest.fn() },
}));
jest.mock('@/services/receiptParser', () => ({
  parseReceipt: jest.fn(),
  validateMimeType: jest.fn(),
  sanitizeFilename: jest.fn((f: string) => f),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    carbonLog: { create: jest.fn() },
  },
}));

import { POST } from '@/app/api/carbon/upload/route';
import { auth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { validateMimeType } from '@/services/receiptParser';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockRateLimit = rateLimiters.carbonUpload as jest.MockedFunction<typeof rateLimiters.carbonUpload>;
const mockValidateMime = validateMimeType as jest.MockedFunction<typeof validateMimeType>;

const mockSession = {
  user: { id: 'user-id', email: 'test@example.com', name: 'Test' },
  expires: '2099-01-01',
};

describe('POST /api/carbon/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    mockValidateMime.mockReturnValue(true);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const formData = new FormData();
    formData.append('file', new Blob(['%PDF'], { type: 'application/pdf' }), 'receipt.pdf');

    const req = new NextRequest('http://localhost:3000/api/carbon/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file provided', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const formData = new FormData();
    const req = new NextRequest('http://localhost:3000/api/carbon/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain('No file');
  });

  it('returns 400 for unsupported file type', async () => {
    mockAuth.mockResolvedValue(mockSession as never);

    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'doc.txt');

    const req = new NextRequest('http://localhost:3000/api/carbon/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockAuth.mockResolvedValue(mockSession as never);
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 30 });

    const formData = new FormData();
    formData.append('file', new Blob(['%PDF'], { type: 'application/pdf' }), 'receipt.pdf');

    const req = new NextRequest('http://localhost:3000/api/carbon/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
