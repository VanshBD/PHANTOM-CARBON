jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    carbonLog: { create: jest.fn() },
  },
}));

import { POST } from '@/app/api/carbon/save/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockCreate = prisma.carbonLog.create as jest.Mock;

const mockSession = {
  user: { id: 'user-id', email: 'test@example.com', name: 'Test' },
  expires: '2099-01-01',
};

const validPayload = {
  fileName: 'receipt.jpg',
  inputType: 'RECEIPT',
  surfaceCarbon: 1.2,
  shadowCarbon: 0.8,
  ghostCarbon: 0.4,
  totalCarbon: 2.4,
  breakdown: { food: 1.2, transport: 1.2 },
  confidence: 0.9,
  summary: 'Tuition fee receipt',
};

describe('POST /api/carbon/save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockCreate.mockResolvedValue({ id: 'log-123', createdAt: new Date('2025-06-01') });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/carbon/save', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/carbon/save', {
      method: 'POST',
      body: JSON.stringify({ totalCarbon: -5 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('saves confirmed extraction and returns 201', async () => {
    const req = new NextRequest('http://localhost:3000/api/carbon/save', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-id',
          inputType: 'RECEIPT',
          totalCarbon: 2.4,
        }),
      })
    );
    expect(json.data.logId).toBe('log-123');
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/carbon/save', {
      method: 'POST',
      body: 'not-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
