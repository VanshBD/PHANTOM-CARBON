/**
 * Groq client tests
 */

describe('groq module', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('exports GROQ_MODEL with default value', () => {
    const { GROQ_MODEL } = require('@/lib/groq');
    expect(typeof GROQ_MODEL).toBe('string');
    expect(GROQ_MODEL.length).toBeGreaterThan(0);
  });

  it('exports GROQ_PARAMS with extraction and oracle configs', () => {
    const { GROQ_PARAMS } = require('@/lib/groq');
    expect(GROQ_PARAMS.extraction).toBeDefined();
    expect(GROQ_PARAMS.extraction.max_tokens).toBe(1024);
    expect(GROQ_PARAMS.extraction.temperature).toBe(0.3);
    expect(GROQ_PARAMS.oracle).toBeDefined();
    expect(GROQ_PARAMS.oracle.max_tokens).toBe(2048);
    expect(GROQ_PARAMS.oracle.temperature).toBe(0.8);
  });

  it('throws clear error when GROQ_API_KEY is missing', () => {
    const originalKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    jest.resetModules();
    const { getGroqClient } = require('@/lib/groq');

    expect(() => getGroqClient()).toThrow('GROQ_API_KEY');

    process.env.GROQ_API_KEY = originalKey;
  });

  it('returns singleton client on repeated calls', () => {
    process.env.GROQ_API_KEY = 'test-key-for-singleton';
    jest.resetModules();

    jest.mock('groq-sdk', () =>
      jest.fn().mockImplementation(() => ({ chat: { completions: { create: jest.fn() } } }))
    );

    const { getGroqClient } = require('@/lib/groq');
    const c1 = getGroqClient();
    const c2 = getGroqClient();
    expect(c1).toBe(c2); // same instance
  });

  it('uses GROQ_MODEL env var when set', () => {
    const original = process.env.GROQ_MODEL;
    process.env.GROQ_MODEL = 'custom-model-test';
    jest.resetModules();
    const { GROQ_MODEL } = require('@/lib/groq');
    expect(GROQ_MODEL).toBe('custom-model-test');
    process.env.GROQ_MODEL = original;
  });
});
