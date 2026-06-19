import Groq from 'groq-sdk';

// Validate required env vars at startup
function validateGroqConfig(): void {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      '[Groq] GROQ_API_KEY environment variable is required. ' +
        'Copy .env.example to .env.local and add your Groq API key.'
    );
  }
}

let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqClient) {
    validateGroqConfig();
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// Groq call parameters per use case
export const GROQ_PARAMS = {
  extraction: {
    max_tokens: 1024,
    temperature: 0.3, // low temp = consistent extraction
  },
  oracle: {
    max_tokens: 2048,
    temperature: 0.8, // higher temp = creative scenarios
  },
  receipt: {
    max_tokens: 1024,
    temperature: 0.2, // very consistent for structured data
  },
} as const;
