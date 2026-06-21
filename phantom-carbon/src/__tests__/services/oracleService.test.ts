jest.mock('@/lib/redis', () => ({
  redisGet: jest.fn(),
  redisSet: jest.fn(),
}));

jest.mock('@/lib/groq', () => ({
  getGroqClient: jest.fn(),
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  GROQ_PARAMS: { oracle: { max_tokens: 2048, temperature: 0.8 } },
}));

import { generateScenarios, getOracleCacheKey } from '@/services/oracleService';
import { redisGet, redisSet } from '@/lib/redis';
import { getGroqClient } from '@/lib/groq';
import type { CarbonSummary } from '@/types';

const mockRedisGet = redisGet as jest.MockedFunction<typeof redisGet>;
const mockRedisSet = redisSet as jest.MockedFunction<typeof redisSet>;
const mockGetGroqClient = getGroqClient as jest.MockedFunction<typeof getGroqClient>;

const mockSummary: CarbonSummary = {
  period: '7d',
  totalSurface: 30,
  totalShadow: 20,
  totalGhost: 10,
  totalCarbon: 60,
  dailyBreakdown: [],
  trend: 'stable',
  categoryBreakdown: { transport: 20, food: 30, digital: 10 },
};

const MOCK_ORACLE_RESPONSE = JSON.stringify({
  dark_future: 'Your city is unrecognizable in 2050...',
  possible_future: 'You walk to a shaded market in 2050...',
  phantom_future: 'Your street is lined with solar panels in 2050...',
});

describe('OracleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it('regenerates when cached shape is invalid', async () => {
    mockRedisGet.mockResolvedValue(JSON.stringify({ darkFuture: 'only one field' }));

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: MOCK_ORACLE_RESPONSE } }],
    });
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    const result = await generateScenarios('user-invalid-cache', mockSummary, 'Pune', 'India');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.darkFuture).toContain('unrecognizable');
  });

  it('returns cached result when available', async () => {
    const cachedScenario = JSON.stringify({
      darkFuture: 'Cached dark',
      possibleFuture: 'Cached possible',
      phantomFuture: 'Cached phantom',
      weeklyCarbon: 60,
    });
    mockRedisGet.mockResolvedValue(cachedScenario);

    const result = await generateScenarios('user-1', mockSummary, 'Mumbai', 'India');

    expect(result.darkFuture).toBe('Cached dark');
    expect(mockGetGroqClient).not.toHaveBeenCalled();
  });

  it('calls Groq on cache miss and caches result', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: MOCK_ORACLE_RESPONSE } }],
    });
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    const result = await generateScenarios('user-2', mockSummary, 'Delhi', 'India');

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    expect(result.darkFuture).toContain('unrecognizable');
  });

  it('returns fallback scenario on Groq error', async () => {
    const mockCreate = jest.fn().mockRejectedValue(new Error('Groq API down'));
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    const result = await generateScenarios('user-3', mockSummary, 'Chennai', 'India');

    // Fallback should still have valid structure
    expect(result.darkFuture.length).toBeGreaterThan(0);
    expect(result.possibleFuture.length).toBeGreaterThan(0);
    expect(result.phantomFuture.length).toBeGreaterThan(0);
    expect(result.weeklyCarbon).toBe(60);
  });

  it('generates cache key with user ID and week number', () => {
    const key = getOracleCacheKey('user-abc');
    expect(key).toMatch(/^oracle:user-abc:\d{4}:\d+$/);
  });
});
