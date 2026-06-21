import type { CarbonBreakdown } from '@/types';

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
