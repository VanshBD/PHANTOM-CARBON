import { inferGhostCarbon, inferGhostCarbonBatch } from '@/services/ghostInferencer';

describe('GhostInferencer', () => {
  describe('inferGhostCarbon', () => {
    it('calculates food delivery carbon correctly (₹500 × 1.2/1000 = 0.6kg)', () => {
      const result = inferGhostCarbon('food_delivery', 500);
      expect(result.estimatedKg).toBeCloseTo(0.6, 3);
    });

    it('calculates streaming with duration (2h × 0.4 = 0.8kg)', () => {
      const result = inferGhostCarbon('streaming', 0, 2);
      expect(result.estimatedKg).toBeCloseTo(0.8, 3);
    });

    it('calculates e_commerce correctly (₹1000 × 1.8/1000 = 1.8kg)', () => {
      const result = inferGhostCarbon('e_commerce', 1000);
      expect(result.estimatedKg).toBeCloseTo(1.8, 3);
    });

    it('returns confidence value between 0 and 1', () => {
      const result = inferGhostCarbon('food_delivery', 500);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('returns non-empty sources array', () => {
      const result = inferGhostCarbon('streaming', 0, 1);
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('returns non-empty explanation', () => {
      const result = inferGhostCarbon('ride_hailing', 200);
      expect(result.explanation.length).toBeGreaterThan(0);
    });

    it('handles unknown category gracefully with conservative estimate', () => {
      const result = inferGhostCarbon('unknown_service', 1000);
      expect(result.estimatedKg).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('handles hyphenated category names', () => {
      const result = inferGhostCarbon('food-delivery', 1000);
      expect(result.estimatedKg).toBeGreaterThan(0);
    });
  });

  describe('inferGhostCarbonBatch', () => {
    it('returns total as sum of individual estimates', () => {
      const items = [
        { category: 'food_delivery', amountINR: 500 },
        { category: 'streaming', amountINR: 0, durationHours: 1 },
      ];
      const result = inferGhostCarbonBatch(items);
      expect(result.items.length).toBe(2);
      const expectedTotal = result.items.reduce((s, i) => s + i.estimatedKg, 0);
      expect(result.total).toBeCloseTo(expectedTotal, 3);
    });

    it('returns zero for empty array', () => {
      const result = inferGhostCarbonBatch([]);
      expect(result.total).toBe(0);
      expect(result.items.length).toBe(0);
    });
  });
});
