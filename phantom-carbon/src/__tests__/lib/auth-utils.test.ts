jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import { validateUserCredentials } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCompare = bcryptjs.compare as jest.Mock;

describe('validateUserCredentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null for invalid email format', async () => {
    const result = await validateUserCredentials({ email: 'bad', password: 'x' });
    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns null when user is not found', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await validateUserCredentials({
      email: 'missing@example.com',
      password: 'Secret123',
    });
    expect(result).toBeNull();
  });

  it('returns null when password does not match', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      passwordHash: 'hash',
    });
    mockCompare.mockResolvedValue(false);

    const result = await validateUserCredentials({
      email: 'user@example.com',
      password: 'Wrong123',
    });
    expect(result).toBeNull();
  });

  it('returns safe user fields when credentials are valid', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      passwordHash: 'hash',
    });
    mockCompare.mockResolvedValue(true);

    const result = await validateUserCredentials({
      email: 'user@example.com',
      password: 'Valid123',
    });

    expect(result).toEqual({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
    });
    expect(result).not.toHaveProperty('passwordHash');
  });
});
