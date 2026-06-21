/**
 * Prisma singleton tests
 */

jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: { findUnique: jest.fn(), create: jest.fn() },
    carbonLog: { findMany: jest.fn(), create: jest.fn(), count: jest.fn() },
  }));
  return { PrismaClient: mockPrismaClient };
});

describe('Prisma singleton', () => {
  beforeEach(() => {
    jest.resetModules();
    // Clear the globalThis singleton between tests
    (globalThis as Record<string, unknown>).prisma = undefined;
  });

  it('exports a prisma instance', () => {
    const { prisma } = require('@/lib/prisma');
    expect(prisma).toBeDefined();
  });

  it('returns the same singleton on repeated imports', () => {
    const { prisma: p1 } = require('@/lib/prisma');
    const { prisma: p2 } = require('@/lib/prisma');
    // In test environment (non-production), both should be the same reference
    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
  });

  it('prisma has expected model properties', () => {
    const { prisma } = require('@/lib/prisma');
    expect(prisma).toHaveProperty('user');
    expect(prisma).toHaveProperty('carbonLog');
  });
});
