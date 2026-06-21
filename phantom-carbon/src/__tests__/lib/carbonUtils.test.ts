import {
  aggregateCategoryBreakdown,
  aggregateCarbonTotals,
  buildCarbonSummaryFromLogs,
  buildDailyBreakdown,
  computeCarbonTrend,
  createEmptyCarbonSummary,
  getPeriodDays,
} from '@/lib/carbonUtils';

describe('aggregateCarbonTotals', () => {
  it('sums all carbon fields correctly', () => {
    const logs = [
      { surfaceCarbon: 2.1, shadowCarbon: 1.5, ghostCarbon: 0.8, totalCarbon: 4.4 },
      { surfaceCarbon: 3.0, shadowCarbon: 2.0, ghostCarbon: 1.0, totalCarbon: 6.0 },
    ];
    const result = aggregateCarbonTotals(logs);
    expect(result.surface).toBeCloseTo(5.1);
    expect(result.shadow).toBeCloseTo(3.5);
    expect(result.ghost).toBeCloseTo(1.8);
    expect(result.total).toBeCloseTo(10.4);
  });

  it('returns zeros for empty array', () => {
    const result = aggregateCarbonTotals([]);
    expect(result).toEqual({ surface: 0, shadow: 0, ghost: 0, total: 0 });
  });
});

describe('aggregateCategoryBreakdown', () => {
  it('aggregates all known categories', () => {
    const logs = [
      { breakdown: { transport: 2.1, food: 1.5, energy: 0.5 } },
      { breakdown: { transport: 1.0, food: 0.8, shopping: 3.0 } },
    ];
    const result = aggregateCategoryBreakdown(logs);
    expect(result.transport).toBeCloseTo(3.1);
    expect(result.food).toBeCloseTo(2.3);
    expect(result.shopping).toBeCloseTo(3.0);
  });

  it('skips null breakdown entries', () => {
    const result = aggregateCategoryBreakdown([
      { breakdown: null },
      { breakdown: { transport: 2.0 } },
    ]);
    expect(result.transport).toBeCloseTo(2.0);
  });
});

describe('getPeriodDays', () => {
  it('maps known periods', () => {
    expect(getPeriodDays('7d')).toBe(7);
    expect(getPeriodDays('30d')).toBe(30);
    expect(getPeriodDays('90d')).toBe(90);
  });

  it('defaults unknown periods to 7', () => {
    expect(getPeriodDays('invalid')).toBe(7);
  });
});

describe('buildDailyBreakdown', () => {
  it('groups logs by date and sums totals', () => {
    const logs = [
      { surfaceCarbon: 1, shadowCarbon: 1, ghostCarbon: 0.5, totalCarbon: 2.5, createdAt: new Date('2026-06-01T10:00:00Z') },
      { surfaceCarbon: 2, shadowCarbon: 0, ghostCarbon: 0, totalCarbon: 2, createdAt: new Date('2026-06-01T18:00:00Z') },
      { surfaceCarbon: 3, shadowCarbon: 1, ghostCarbon: 1, totalCarbon: 5, createdAt: new Date('2026-06-02T09:00:00Z') },
    ];

    const daily = buildDailyBreakdown(logs);
    expect(daily).toHaveLength(2);
    expect(daily[0].date).toBe('2026-06-01');
    expect(daily[0].total).toBeCloseTo(4.5);
    expect(daily[1].total).toBeCloseTo(5);
  });
});

describe('computeCarbonTrend', () => {
  it('returns stable with fewer than 4 days', () => {
    expect(computeCarbonTrend([
      { date: '2026-06-01', surface: 1, shadow: 1, ghost: 0, total: 2 },
      { date: '2026-06-02', surface: 1, shadow: 1, ghost: 0, total: 2 },
    ])).toBe('stable');
  });

  it('detects improving trend when second half is lower', () => {
    const daily = [
      { date: '2026-06-01', surface: 5, shadow: 0, ghost: 0, total: 10 },
      { date: '2026-06-02', surface: 5, shadow: 0, ghost: 0, total: 10 },
      { date: '2026-06-03', surface: 1, shadow: 0, ghost: 0, total: 2 },
      { date: '2026-06-04', surface: 1, shadow: 0, ghost: 0, total: 2 },
    ];
    expect(computeCarbonTrend(daily)).toBe('improving');
  });

  it('detects worsening trend when second half is higher', () => {
    const daily = [
      { date: '2026-06-01', surface: 1, shadow: 0, ghost: 0, total: 2 },
      { date: '2026-06-02', surface: 1, shadow: 0, ghost: 0, total: 2 },
      { date: '2026-06-03', surface: 5, shadow: 0, ghost: 0, total: 10 },
      { date: '2026-06-04', surface: 5, shadow: 0, ghost: 0, total: 10 },
    ];
    expect(computeCarbonTrend(daily)).toBe('worsening');
  });
});

describe('buildCarbonSummaryFromLogs', () => {
  it('returns empty summary for no logs', () => {
    expect(buildCarbonSummaryFromLogs('7d', [])).toEqual(createEmptyCarbonSummary('7d'));
  });

  it('builds a complete summary with trend and top action', () => {
    const logs = [
      {
        surfaceCarbon: 2, shadowCarbon: 1, ghostCarbon: 0.5, totalCarbon: 3.5,
        breakdown: { transport: 2 },
        createdAt: new Date('2026-06-01'),
        rawAiResponse: null,
      },
      {
        surfaceCarbon: 3, shadowCarbon: 2, ghostCarbon: 1, totalCarbon: 6,
        breakdown: { food: 3 },
        createdAt: new Date('2026-06-02'),
        rawAiResponse: { topAction: 'Take the metro' },
      },
    ];

    const summary = buildCarbonSummaryFromLogs('7d', logs);
    expect(summary.totalCarbon).toBeCloseTo(9.5);
    expect(summary.categoryBreakdown.transport).toBeCloseTo(2);
    expect(summary.topAction).toBe('Take the metro');
    expect(summary.dailyBreakdown).toHaveLength(2);
  });
});
