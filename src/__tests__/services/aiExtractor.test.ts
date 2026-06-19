// Mock dependencies before imports
jest.mock('groq-sdk');
jest.mock('@/lib/redis', () => ({
  redis: {},
  redisGet: jest.fn(),
  redisSet: jest.fn(),
}));

jest.mock('@/lib/groq', () => ({
  getGroqClient: jest.fn(),
  GROQ_MODEL: 'llama-3.3-70b-versatile',
  GROQ_PARAMS: {
    extraction: { max_tokens: 1024, temperature: 0.3 },
  },
}));

import { extractCarbonFromText } from '@/services/aiExtractor';
import { redisGet, redisSet } from '@/lib/redis';
import { getGroqClient } from '@/lib/groq';

const mockRedisGet = redisGet as jest.MockedFunction<typeof redisGet>;
const mockRedisSet = redisSet as jest.MockedFunction<typeof redisSet>;
const mockGetGroqClient = getGroqClient as jest.MockedFunction<typeof getGroqClient>;

const MOCK_GROQ_RESPONSE = JSON.stringify({
  activities: [
    {
      description: 'Car journey 10km petrol',
      layer: 'surface',
      category: 'transport',
      kg_co2e: 2.1,
      confidence: 0.9,
    },
  ],
  total_surface: 2.1,
  total_shadow: 0,
  total_ghost: 0,
  total_co2e: 2.1,
  summary: 'Your car journey generated 2.1 kg CO2e.',
  top_action: 'Consider taking the bus for this journey.',
});

describe('AIExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
  });

  it('returns cached result on cache hit', async () => {
    mockRedisGet.mockResolvedValue(MOCK_GROQ_RESPONSE);

    const result = await extractCarbonFromText('I drove 10km to work');

    expect(result.totalCarbon).toBeCloseTo(2.1);
    expect(result.surfaceCarbon).toBeCloseTo(2.1);
    expect(mockGetGroqClient).not.toHaveBeenCalled();
  });

  it('calls Groq API on cache miss', async () => {
    mockRedisGet.mockResolvedValue(null);

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: MOCK_GROQ_RESPONSE } }],
    });
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    await extractCarbonFromText('I drove 10km to work');

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('stores result in cache after Groq call', async () => {
    mockRedisGet.mockResolvedValue(null);

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: MOCK_GROQ_RESPONSE } }],
    });
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    await extractCarbonFromText('I drove 10km to work');

    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledWith(
      expect.stringContaining('groq:extract:'),
      MOCK_GROQ_RESPONSE,
      3600
    );
  });

  it('handles malformed Groq JSON response gracefully', async () => {
    mockRedisGet.mockResolvedValue(null);

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'This is not JSON at all!' } }],
    });
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    const result = await extractCarbonFromText('I drove to work');

    expect(result.totalCarbon).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.sources).toHaveLength(0);
  });

  it('returns empty extraction on Groq API error', async () => {
    mockRedisGet.mockResolvedValue(null);

    const mockCreate = jest.fn().mockRejectedValue(new Error('API rate limit exceeded'));
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    const result = await extractCarbonFromText('I flew to Delhi');

    expect(result.totalCarbon).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.summary).toContain('Unable to analyze');
  });

  it('correctly maps activities to breakdown categories', async () => {
    mockRedisGet.mockResolvedValue(null);

    const multiCategoryResponse = JSON.stringify({
      activities: [
        { description: 'Car', layer: 'surface', category: 'transport', kg_co2e: 2.0, confidence: 0.9 },
        { description: 'Beef', layer: 'surface', category: 'food', kg_co2e: 2.5, confidence: 0.85 },
      ],
      total_surface: 4.5,
      total_shadow: 0,
      total_ghost: 0,
      total_co2e: 4.5,
      summary: 'Your activities generated 4.5 kg CO2e.',
      top_action: 'Try plant-based meals.',
    });

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: multiCategoryResponse } }],
    });
    mockGetGroqClient.mockReturnValue({
      chat: { completions: { create: mockCreate } },
    } as never);

    const result = await extractCarbonFromText('I drove and ate beef today');

    expect(result.breakdown.transport).toBeCloseTo(2.0);
    expect(result.breakdown.food).toBeCloseTo(2.5);
  });
});
