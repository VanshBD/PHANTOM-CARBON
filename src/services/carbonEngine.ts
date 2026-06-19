import type {
  SurfaceItem,
  PurchaseItem,
  DigitalItem,
  CarbonExtraction,
  CarbonCategory,
} from '@/types';

// ============================================================
// Emission Factors (kg CO2e per unit)
// Sources: IPCC AR6, DEFRA 2023, IEA 2023, CEEW India Grid
// ============================================================

const SURFACE_FACTORS: Record<SurfaceItem['type'], number> = {
  // Transport (per km)
  car_petrol: 0.21,
  car_electric: 0.053,
  bus: 0.089,
  train: 0.041,
  flight_short: 0.255,
  flight_long: 0.195,
  motorcycle: 0.114,
  // Food (per meal/serving)
  beef_meal: 2.5,
  chicken_meal: 0.7,
  fish_meal: 0.6,
  vegetarian_meal: 0.3,
  vegan_meal: 0.18,
  dairy_serving: 0.6,
  // Energy (per kWh or m3)
  grid_electricity_india: 0.82,
  grid_electricity_eu: 0.276,
  natural_gas: 2.04,
};

// Shadow Carbon: kg CO2e per ₹1000 spent
const SHADOW_MULTIPLIERS: Record<PurchaseItem['category'], number> = {
  fast_fashion: 3.2,
  electronics: 8.5,
  furniture: 2.1,
  groceries_packaged: 1.4,
  personal_care: 1.8,
};

// Ghost Carbon: kg CO2e per unit (trip, hour, GB)
const GHOST_FACTORS: Record<DigitalItem['type'], number> = {
  online_delivery: 0.8, // per trip (platform infra)
  streaming: 0.036, // per hour
  cloud_storage: 0.003, // per GB per month
  ride_hailing: 0.4, // per trip (server + dispatch)
};

// ============================================================
// Calculation Functions
// ============================================================

/**
 * Calculate Surface Carbon from direct emission activities.
 * Uses IPCC AR6 and DEFRA 2023 emission factors.
 * 
 * @param items - Array of surface emission items with type and amount
 * @returns Total surface carbon in kg CO₂e
 * 
 * @example
 * calculateSurface([{ type: 'car_petrol', amount: 25 }]) // 5.25 kg
 */
export function calculateSurface(items: SurfaceItem[]): number {
  if (!items || items.length === 0) return 0;

  return items.reduce((total, item) => {
    const factor = SURFACE_FACTORS[item.type];
    if (factor === undefined) {
      console.warn(`[CarbonEngine] Unknown surface item type: ${item.type}`);
      return total;
    }
    return total + factor * item.amount;
  }, 0);
}

/**
 * Calculate Shadow Carbon from purchases (product lifecycle emissions)
 */
export function calculateShadow(purchases: PurchaseItem[]): number {
  if (!purchases || purchases.length === 0) return 0;

  return purchases.reduce((total, item) => {
    const multiplier = SHADOW_MULTIPLIERS[item.category];
    if (multiplier === undefined) {
      console.warn(`[CarbonEngine] Unknown shadow category: ${item.category}`);
      return total;
    }
    // Convert from ₹1000 units to actual amount
    return total + (multiplier * item.amountINR) / 1000;
  }, 0);
}

/**
 * Calculate Ghost Carbon from digital activities and supply chains
 */
export function calculateGhost(digital: DigitalItem[]): number {
  if (!digital || digital.length === 0) return 0;

  return digital.reduce((total, item) => {
    const factor = GHOST_FACTORS[item.type];
    if (factor === undefined) {
      console.warn(`[CarbonEngine] Unknown ghost item type: ${item.type}`);
      return total;
    }
    return total + factor * item.amount;
  }, 0);
}

/**
 * Get total carbon from a full extraction object
 */
export function getTotalCarbon(extraction: CarbonExtraction): number {
  return extraction.surfaceCarbon + extraction.shadowCarbon + extraction.ghostCarbon;
}

/**
 * Classify a daily carbon total into a category
 *
 * Thresholds (kg CO2e / day):
 * - excellent: < 3
 * - good:      3–6
 * - average:   6–10
 * - high:      10–15
 * - critical:  > 15
 */
export function getCarbonCategory(kg: number): CarbonCategory {
  if (kg < 3) return 'excellent';
  if (kg < 6) return 'good';
  if (kg < 10) return 'average';
  if (kg < 15) return 'high';
  return 'critical';
}

// Visual properties for each category (used in UI)
export const CATEGORY_CONFIG: Record<
  CarbonCategory,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  excellent: {
    label: 'Excellent',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30 border-green-700',
    icon: '🌱',
  },
  good: {
    label: 'Good',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30 border-emerald-700',
    icon: '✅',
  },
  average: {
    label: 'Average',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30 border-yellow-700',
    icon: '⚡',
  },
  high: {
    label: 'High',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30 border-orange-700',
    icon: '⚠️',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30 border-red-700',
    icon: '🚨',
  },
};
