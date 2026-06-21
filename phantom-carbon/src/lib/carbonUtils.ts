import type { CarbonBreakdown, CarbonSummary, DailyCarbon } from '@/types';

/**
 * Aggregate carbon breakdown fields from a list of log records.
 * Extracts transport, food, energy, shopping, digital and supplyChain
 * values from each log's breakdown JSON and sums them.
 *
 * @param logs - Array of objects containing a `breakdown` JSON field
 * @returns Aggregated CarbonBreakdown with summed category values
 */
export function aggregateCategoryBreakdown(
  logs: Array<{ breakdown: unknown }>
): CarbonBreakdown {
  const result: CarbonBreakdown = {};
  const keys = ['transport', 'food', 'energy', 'shopping', 'digital', 'supplyChain'] as const;

  for (const log of logs) {
    const bd = log.breakdown as CarbonBreakdown | null;
    if (!bd) continue;
    for (const key of keys) {
      const val = bd[key];
      if (val) result[key] = (result[key] ?? 0) + val;
    }
  }

  return result;
}

/**
 * Compute a carbon totals object from a list of log records.
 *
 * @param logs - Array of log records with surfaceCarbon, shadowCarbon, ghostCarbon, totalCarbon
 * @returns Aggregated { surface, shadow, ghost, total }
 */
export function aggregateCarbonTotals(
  logs: Array<{ surfaceCarbon: number; shadowCarbon: number; ghostCarbon: number; totalCarbon: number }>
): { surface: number; shadow: number; ghost: number; total: number } {
  return logs.reduce(
    (acc, log) => ({
      surface: acc.surface + log.surfaceCarbon,
      shadow:  acc.shadow  + log.shadowCarbon,
      ghost:   acc.ghost   + log.ghostCarbon,
      total:   acc.total   + log.totalCarbon,
    }),
    { surface: 0, shadow: 0, ghost: 0, total: 0 }
  );
}

/** Map a summary period string to the number of days to query. */
export function getPeriodDays(period: string): number {
  switch (period) {
    case '7d':  return 7;
    case '30d': return 30;
    case '90d': return 90;
    default:    return 7;
  }
}

/** Build per-day carbon totals from log records, sorted chronologically. */
export function buildDailyBreakdown(
  logs: Array<{
    surfaceCarbon: number;
    shadowCarbon: number;
    ghostCarbon: number;
    totalCarbon: number;
    createdAt: Date;
  }>
): DailyCarbon[] {
  const dailyMap = new Map<string, DailyCarbon>();

  for (const log of logs) {
    const dateKey = log.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) ?? {
      date: dateKey,
      surface: 0,
      shadow: 0,
      ghost: 0,
      total: 0,
    };

    dailyMap.set(dateKey, {
      ...existing,
      surface: existing.surface + log.surfaceCarbon,
      shadow:  existing.shadow  + log.shadowCarbon,
      ghost:   existing.ghost   + log.ghostCarbon,
      total:   existing.total   + log.totalCarbon,
    });
  }

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compare first vs second half of daily data to detect emission trend.
 * Requires at least 4 days of data; otherwise returns stable.
 */
export function computeCarbonTrend(
  dailyBreakdown: DailyCarbon[]
): 'improving' | 'worsening' | 'stable' {
  if (dailyBreakdown.length < 4) return 'stable';

  const mid = Math.floor(dailyBreakdown.length / 2);
  const firstAvg =
    dailyBreakdown.slice(0, mid).reduce((sum, day) => sum + day.total, 0) / mid;
  const secondAvg =
    dailyBreakdown.slice(mid).reduce((sum, day) => sum + day.total, 0) /
    (dailyBreakdown.length - mid);

  if (secondAvg < firstAvg * 0.95) return 'improving';
  if (secondAvg > firstAvg * 1.05) return 'worsening';
  return 'stable';
}

/** Empty summary shape for users with no logs in the selected period. */
export function createEmptyCarbonSummary(period: string): CarbonSummary {
  return {
    period,
    totalSurface: 0,
    totalShadow: 0,
    totalGhost: 0,
    totalCarbon: 0,
    dailyBreakdown: [],
    trend: 'stable',
    categoryBreakdown: {},
  };
}

type SummaryLog = {
  surfaceCarbon: number;
  shadowCarbon: number;
  ghostCarbon: number;
  totalCarbon: number;
  breakdown: unknown;
  createdAt: Date;
  rawAiResponse: unknown;
};

/**
 * Build a complete CarbonSummary from raw log records.
 * Centralises aggregation logic used by the dashboard and summary API.
 */
export function buildCarbonSummaryFromLogs(period: string, logs: SummaryLog[]): CarbonSummary {
  if (logs.length === 0) return createEmptyCarbonSummary(period);

  const totals = aggregateCarbonTotals(logs);
  const categoryBreakdown = aggregateCategoryBreakdown(logs);
  const dailyBreakdown = buildDailyBreakdown(logs);
  const trend = computeCarbonTrend(dailyBreakdown);
  const latestLog = logs[logs.length - 1];
  const rawResponse = latestLog?.rawAiResponse as { topAction?: string } | null;

  return {
    period,
    totalSurface: Math.round(totals.surface * 100) / 100,
    totalShadow:  Math.round(totals.shadow  * 100) / 100,
    totalGhost:   Math.round(totals.ghost   * 100) / 100,
    totalCarbon:  Math.round(totals.total   * 100) / 100,
    dailyBreakdown,
    trend,
    categoryBreakdown,
    topAction: rawResponse?.topAction,
  };
}
