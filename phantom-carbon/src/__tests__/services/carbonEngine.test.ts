import {
  calculateSurface,
  calculateShadow,
  calculateGhost,
  getCarbonCategory,
} from '@/services/carbonEngine';
import type { SurfaceItem, PurchaseItem, DigitalItem } from '@/types';

describe('CarbonEngine', () => {
  describe('calculateSurface', () => {
    it('returns 0 for empty items array', () => {
      expect(calculateSurface([])).toBe(0);
    });

    it('calculates car petrol emissions correctly (21km × 0.21 = 4.41kg)', () => {
      const items: SurfaceItem[] = [{ type: 'car_petrol', amount: 21 }];
      expect(calculateSurface(items)).toBeCloseTo(4.41, 5);
    });

    it('calculates beef meal emissions correctly (1 meal × 2.5 = 2.5kg)', () => {
      const items: SurfaceItem[] = [{ type: 'beef_meal', amount: 1 }];
      expect(calculateSurface(items)).toBeCloseTo(2.5, 5);
    });

    it('calculates vegan meal emissions correctly (1 meal × 0.18 = 0.18kg)', () => {
      const items: SurfaceItem[] = [{ type: 'vegan_meal', amount: 1 }];
      expect(calculateSurface(items)).toBeCloseTo(0.18, 5);
    });

    it('sums multiple activities correctly', () => {
      const items: SurfaceItem[] = [
        { type: 'car_petrol', amount: 10 }, // 2.1
        { type: 'beef_meal', amount: 1 },   // 2.5
        { type: 'grid_electricity_india', amount: 5 }, // 4.1
      ];
      expect(calculateSurface(items)).toBeCloseTo(2.1 + 2.5 + 4.1, 5);
    });

    it('handles flight short-haul correctly (100km × 0.255 = 25.5kg)', () => {
      const items: SurfaceItem[] = [{ type: 'flight_short', amount: 100 }];
      expect(calculateSurface(items)).toBeCloseTo(25.5, 5);
    });

    it('handles zero amount', () => {
      const items: SurfaceItem[] = [{ type: 'beef_meal', amount: 0 }];
      expect(calculateSurface(items)).toBe(0);
    });
  });

  describe('calculateShadow', () => {
    it('returns 0 for empty purchases array', () => {
      expect(calculateShadow([])).toBe(0);
    });

    it('applies fast fashion multiplier correctly (₹1000 × 3.2/1000 = 3.2kg)', () => {
      const items: PurchaseItem[] = [{ category: 'fast_fashion', amountINR: 1000 }];
      expect(calculateShadow(items)).toBeCloseTo(3.2, 5);
    });

    it('applies electronics multiplier correctly (₹2000 × 8.5/1000 = 17kg)', () => {
      const items: PurchaseItem[] = [{ category: 'electronics', amountINR: 2000 }];
      expect(calculateShadow(items)).toBeCloseTo(17.0, 5);
    });

    it('applies furniture multiplier correctly', () => {
      const items: PurchaseItem[] = [{ category: 'furniture', amountINR: 5000 }];
      expect(calculateShadow(items)).toBeCloseTo(10.5, 5);
    });

    it('sums multiple purchases correctly', () => {
      const items: PurchaseItem[] = [
        { category: 'fast_fashion', amountINR: 500 },  // 1.6
        { category: 'electronics', amountINR: 1000 }, // 8.5
      ];
      expect(calculateShadow(items)).toBeCloseTo(1.6 + 8.5, 5);
    });
  });

  describe('calculateGhost', () => {
    it('returns 0 for empty digital array', () => {
      expect(calculateGhost([])).toBe(0);
    });

    it('calculates streaming carbon correctly (2 hours × 0.036 = 0.072kg)', () => {
      const items: DigitalItem[] = [{ type: 'streaming', amount: 2 }];
      expect(calculateGhost(items)).toBeCloseTo(0.072, 5);
    });

    it('calculates delivery platform carbon correctly (1 trip × 0.8 = 0.8kg)', () => {
      const items: DigitalItem[] = [{ type: 'online_delivery', amount: 1 }];
      expect(calculateGhost(items)).toBeCloseTo(0.8, 5);
    });

    it('calculates cloud storage correctly (10 GB × 0.003 = 0.03kg)', () => {
      const items: DigitalItem[] = [{ type: 'cloud_storage', amount: 10 }];
      expect(calculateGhost(items)).toBeCloseTo(0.03, 5);
    });

    it('calculates ride-hailing correctly (3 trips × 0.4 = 1.2kg)', () => {
      const items: DigitalItem[] = [{ type: 'ride_hailing', amount: 3 }];
      expect(calculateGhost(items)).toBeCloseTo(1.2, 5);
    });
  });

  describe('getCarbonCategory', () => {
    it('returns "excellent" for < 3kg/day', () => {
      expect(getCarbonCategory(0)).toBe('excellent');
      expect(getCarbonCategory(2.9)).toBe('excellent');
    });

    it('returns "good" for 3-6 kg/day', () => {
      expect(getCarbonCategory(3)).toBe('good');
      expect(getCarbonCategory(5.9)).toBe('good');
    });

    it('returns "average" for 6-10 kg/day', () => {
      expect(getCarbonCategory(6)).toBe('average');
      expect(getCarbonCategory(9.9)).toBe('average');
    });

    it('returns "high" for 10-15 kg/day', () => {
      expect(getCarbonCategory(10)).toBe('high');
      expect(getCarbonCategory(14.9)).toBe('high');
    });

    it('returns "critical" for > 15kg', () => {
      expect(getCarbonCategory(15)).toBe('critical');
      expect(getCarbonCategory(100)).toBe('critical');
    });

    it('handles boundary values correctly', () => {
      expect(getCarbonCategory(3)).toBe('good');
      expect(getCarbonCategory(6)).toBe('average');
      expect(getCarbonCategory(10)).toBe('high');
      expect(getCarbonCategory(15)).toBe('critical');
    });
  });
});
