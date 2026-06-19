import { getGroqClient, GROQ_MODEL, GROQ_PARAMS } from '@/lib/groq';
import { redisGet, redisSet } from '@/lib/redis';
import type { OracleScenario, CarbonSummary } from '@/types';

// Cache oracle results for 7 days per user per week
const ORACLE_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Get the current ISO week number (for cache key bucketing)
 */
function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Build the Oracle cache key
 */
export function getOracleCacheKey(userId: string): string {
  const weekNumber = getWeekNumber();
  const year = new Date().getFullYear();
  return `oracle:${userId}:${year}:${weekNumber}`;
}

/**
 * Build the Groq prompt for oracle scenario generation
 */
function buildOraclePrompt(summary: CarbonSummary, city: string, country: string): string {
  const topCategory = Object.entries(summary.categoryBreakdown)
    .filter(([, v]) => v !== undefined && v > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0]?.[0] ?? 'general consumption';

  const userData = JSON.stringify({
    weekly_carbon_kg: summary.totalCarbon.toFixed(2),
    surface_kg: summary.totalSurface.toFixed(2),
    shadow_kg: summary.totalShadow.toFixed(2),
    ghost_kg: summary.totalGhost.toFixed(2),
    trend: summary.trend,
    top_category: topCategory,
    daily_average_kg: (summary.totalCarbon / 7).toFixed(2),
  });

  return `You are the Phantom Carbon Oracle. Based on this user's carbon data, generate three short, emotionally resonant future scenarios for their city in the year 2050.

User data: ${userData}
City: ${city}, ${country}

Write each scenario as a vivid, personal 80-word narrative. Use second person ("you", "your street"). Make it specific, real, and emotionally honest — not preachy. Reference real things: local landmarks, seasons, daily routines.

Respond ONLY with JSON (no markdown, no explanation):
{
  "dark_future": "...",
  "possible_future": "...",
  "phantom_future": "..."
}

dark_future: if current habits continue — realistic, sobering, not apocalyptic
possible_future: if moderate changes made — hopeful but honest, real trade-offs
phantom_future: if ghost carbon also addressed — inspiring, specific, achievable`;
}

/**
 * Parse the oracle response JSON
 */
function parseOracleResponse(
  content: string
): { dark_future: string; possible_future: string; phantom_future: string } | null {
  try {
    const cleaned = content.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[OracleService] Failed to parse Groq response:', err);
    return null;
  }
}

/**
 * Generate three 2050 future scenarios for the user's city
 * Results are cached per user per week in Redis
 */
export async function generateScenarios(
  userId: string,
  summary: CarbonSummary,
  city: string,
  country: string
): Promise<OracleScenario> {
  const cacheKey = getOracleCacheKey(userId);

  // Check for cached oracle this week
  const cached = await redisGet(cacheKey);
  if (cached) {
    console.info(`[OracleService] Cache HIT for user ${userId}`);
    const parsed = JSON.parse(cached) as OracleScenario;
    return parsed;
  }

  console.info(`[OracleService] Cache MISS — generating new oracle for user ${userId}`);

  try {
    const client = getGroqClient();
    const prompt = buildOraclePrompt(summary, city, country);

    const response = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      ...GROQ_PARAMS.oracle,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return getFallbackScenario(summary, city);
    }

    const parsed = parseOracleResponse(content);
    if (!parsed) {
      return getFallbackScenario(summary, city);
    }

    const scenario: OracleScenario = {
      darkFuture: parsed.dark_future,
      possibleFuture: parsed.possible_future,
      phantomFuture: parsed.phantom_future,
      weeklyCarbon: summary.totalCarbon,
    };

    // Cache for 7 days
    await redisSet(cacheKey, JSON.stringify(scenario), ORACLE_CACHE_TTL);

    return scenario;
  } catch (err) {
    console.error('[OracleService] Groq API error:', err);
    return getFallbackScenario(summary, city);
  }
}

/**
 * Fallback scenarios when AI is unavailable
 */
function getFallbackScenario(summary: CarbonSummary, city: string): OracleScenario {
  const weeklyKg = summary.totalCarbon.toFixed(1);

  return {
    darkFuture: `With ${weeklyKg}kg of CO2e per week continuing, ${city} in 2050 faces intense heat waves and water scarcity. The parks you loved are gone. Air conditioning runs 24/7, but the grid struggles. You adapt, but the city you grew up in is gone.`,
    possibleFuture: `You reduced your emissions by 30%. ${city} in 2050 is warmer, but resilient. Your neighborhood has solar panels, the metro expanded, and you eat differently. It's still the city you love — adapted, not defeated.`,
    phantomFuture: `You tackled surface, shadow, and ghost carbon. ${city} in 2050 is a climate-positive city. Cooler streets, electric everything, local food. Your choices in 2025 quietly shaped a city your children love to walk through.`,
    weeklyCarbon: summary.totalCarbon,
  };
}
