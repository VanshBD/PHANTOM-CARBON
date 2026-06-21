import { aggregateCategoryBreakdown, aggregateCarbonTotals } from '@/lib/carbonUtils';

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
    expect(result.surface).toBe(0);
    expect(result.shadow).toBe(0);
    expect(result.ghost).toBe(0);
    expect(result.total).toBe(0);
  });

  it('handles single log correctly', () => {
    const result = aggregateCarbonTotals([
      { surfaceCarbon: 5, shadowCarbon: 3, ghostCarbon: 1, totalCarbon: 9 },
    ]);
    expect(result.total).toBe(9);
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
    expect(result.energy).toBeCloseTo(0.5);
    expect(result.shopping).toBeCloseTo(3.0);
  });

  it('skips null breakdown entries', () => {
    const logs = [
      { breakdown: null },
      { breakdown: { transport: 2.0 } },
    ];
    const result = aggregateCategoryBreakdown(logs);
    expect(result.transport).toBeCloseTo(2.0);
  });

  it('returns empty object for empty array', () => {
    const result = aggregateCategoryBreakdown([]);
    expect(Object.keys(result).length).toBe(0);
  });

  it('handles digital and supplyChain categories', () => {
    const logs = [
      { breakdown: { digital: 1.5, supplyChain: 2.5 } },
    ];
    const result = aggregateCategoryBreakdown(logs);
    expect(result.digital).toBeCloseTo(1.5);
    expect(result.supplyChain).toBeCloseTo(2.5);
  });

  it('skips zero/undefined values', () => {
    const logs = [{ breakdown: { transport: 0, food: undefined } }];
    const result = aggregateCategoryBreakdown(logs);
    expect(result.transport).toBeUndefined(); // 0 is falsy, not added
    expect(result.food).toBeUndefined();
  });
});
