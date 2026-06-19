import crypto from 'crypto';
import { getGroqClient, GROQ_MODEL, GROQ_PARAMS } from '@/lib/groq';
import { redisGet, redisSet } from '@/lib/redis';
import type { CarbonExtraction, GroqExtractionResponse } from '@/types';

// Cache TTL: 1 hour
const CACHE_TTL = 3600;

// Track cache stats in memory (resets on server restart)
let cacheHits = 0;
let cacheMisses = 0;

const EXTRACTION_SYSTEM_PROMPT = `You are Phantom, an expert carbon footprint analyst AI. Your job is to extract carbon-generating activities from any text the user provides — conversations, descriptions of their day, receipts, or shopping lists.

You MUST respond ONLY with a valid JSON object. No preamble, no explanation, no markdown.

Extract all activities and classify them into three layers:
- surface: direct emissions (transport, energy, food)
- shadow: emissions from purchases and product lifecycle
- ghost: hidden emissions (digital usage, supply chain, delivery services)

For each activity found, estimate kg CO2e using standard emission factors.

Response format (strict JSON only):
{
  "activities": [
    {
      "description": "string — what was identified",
      "layer": "surface" | "shadow" | "ghost",
      "category": "transport" | "food" | "energy" | "shopping" | "digital" | "supplyChain",
      "kg_co2e": number,
      "confidence": number
    }
  ],
  "total_surface": number,
  "total_shadow": number,
  "total_ghost": number,
  "total_co2e": number,
  "summary": "string — one sentence insight for the user",
  "top_action": "string — single most impactful action they could take"
}`;

/**
 * Generate a deterministic SHA-256 cache key for a given input text
 */
function getCacheKey(inputText: string): string {
  const hash = crypto.createHash('sha256').update(inputText.trim().toLowerCase()).digest('hex');
  return `groq:extract:${hash}`;
}

/**
 * Parse Groq response JSON with error handling
 */
function parseGroqResponse(content: string): GroqExtractionResponse | null {
  try {
    // Strip any accidental markdown code fences
    const cleaned = content.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(cleaned) as GroqExtractionResponse;
  } catch (err) {
    console.error('[AIExtractor] Failed to parse Groq JSON response:', err);
    return null;
  }
}

/**
 * Build a CarbonExtraction from a GroqExtractionResponse
 */
function buildExtraction(groqData: GroqExtractionResponse): CarbonExtraction {
  // Aggregate breakdown by category
  const breakdown: CarbonExtraction['breakdown'] = {};
  for (const activity of groqData.activities) {
    const cat = activity.category;
    const current = (() => {
      switch (cat) {
        case 'transport': return breakdown.transport ?? 0;
        case 'food': return breakdown.food ?? 0;
        case 'energy': return breakdown.energy ?? 0;
        case 'shopping': return breakdown.shopping ?? 0;
        case 'digital': return breakdown.digital ?? 0;
        case 'supplyChain': return breakdown.supplyChain ?? 0;
        default: return 0;
      }
    })();

    switch (cat) {
      case 'transport': breakdown.transport = current + activity.kg_co2e; break;
      case 'food': breakdown.food = current + activity.kg_co2e; break;
      case 'energy': breakdown.energy = current + activity.kg_co2e; break;
      case 'shopping': breakdown.shopping = current + activity.kg_co2e; break;
      case 'digital': breakdown.digital = current + activity.kg_co2e; break;
      case 'supplyChain': breakdown.supplyChain = current + activity.kg_co2e; break;
    }
  }

  const avgConfidence =
    groqData.activities.length > 0
      ? groqData.activities.reduce((s, a) => s + a.confidence, 0) / groqData.activities.length
      : 0.5;

  return {
    surfaceCarbon: groqData.total_surface,
    shadowCarbon: groqData.total_shadow,
    ghostCarbon: groqData.total_ghost,
    totalCarbon: groqData.total_co2e,
    breakdown,
    confidence: Math.round(avgConfidence * 100) / 100,
    sources: groqData.activities.map((a) => a.description),
    summary: groqData.summary,
    topAction: groqData.top_action,
  };
}

/**
 * Graceful empty extraction when AI is unavailable
 */
function emptyExtraction(reason: string): CarbonExtraction {
  console.warn('[AIExtractor] Returning empty extraction:', reason);
  return {
    surfaceCarbon: 0,
    shadowCarbon: 0,
    ghostCarbon: 0,
    totalCarbon: 0,
    breakdown: {},
    confidence: 0,
    sources: [],
    summary: 'Unable to analyze this input. Please try again.',
    topAction: undefined,
  };
}

/**
 * Main extraction function — extracts carbon data from natural language text
 * Uses Redis cache to avoid redundant Groq API calls
 */
export async function extractCarbonFromText(inputText: string): Promise<CarbonExtraction> {
  const cacheKey = getCacheKey(inputText);

  // Check cache first
  const cached = await redisGet(cacheKey);
  if (cached) {
    cacheHits++;
    console.info(
      `[AIExtractor] Cache HIT (hits: ${cacheHits}, misses: ${cacheMisses}, ratio: ${(cacheHits / (cacheHits + cacheMisses) * 100).toFixed(1)}%)`
    );
    const parsed = parseGroqResponse(cached);
    if (parsed) return buildExtraction(parsed);
  }

  cacheMisses++;
  console.info(
    `[AIExtractor] Cache MISS (hits: ${cacheHits}, misses: ${cacheMisses})`
  );

  // Call Groq API
  try {
    const client = getGroqClient();
    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: inputText },
      ],
      ...GROQ_PARAMS.extraction,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return emptyExtraction('Empty Groq response');
    }

    // Store raw response in Redis cache before parsing
    await redisSet(cacheKey, content, CACHE_TTL);

    const parsed = parseGroqResponse(content);
    if (!parsed) {
      return emptyExtraction('Malformed Groq JSON response');
    }

    return buildExtraction(parsed);
  } catch (err) {
    console.error('[AIExtractor] Groq API error:', err);
    return emptyExtraction('Groq API error');
  }
}

/**
 * Get current cache hit/miss statistics
 */
export function getCacheStats(): { hits: number; misses: number; ratio: number } {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    ratio: total > 0 ? cacheHits / total : 0,
  };
}
