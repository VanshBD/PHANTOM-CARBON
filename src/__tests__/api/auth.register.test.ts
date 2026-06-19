jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_xyz'),
}));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'new-user-id',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
    });
  });

  it('creates user and returns 201', async () => {
    const res = await POST(makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user.email).toBe('test@example.com');
  });

  it('never returns passwordHash in response', async () => {
    const res = await POST(makeRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
    }));
    const json = await res.json();
    expect(JSON.stringify(json)).not.toContain('passwordHash');
    expect(JSON.stringify(json)).not.toContain('hashed_password');
  });

  it('returns 409 when email already exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-user' });
    const res = await POST(makeRequest({
      name: 'Test User',
      email: 'existing@example.com',
      password: 'Password1',
    }));
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid email', async () => {
    const res = await POST(makeRequest({
      name: 'Test User',
      email: 'not-an-email',
      password: 'Password1',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for weak password', async () => {
    const res = await POST(makeRequest({
      name: 'Test',
      email: 'test@example.com',
      password: 'weak',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for short name', async () => {
    const res = await POST(makeRequest({
      name: 'A',
      email: 'test@example.com',
      password: 'Password1',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: 'invalid-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
