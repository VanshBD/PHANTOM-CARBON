import type { GhostEstimate } from '@/types';

// ============================================================
// Ghost Carbon Multipliers
// Unit: kg CO2e per ₹1000 spent OR per hour/GB depending on type
// Source: Carbon Trust Digital Footprint Study 2023, GHG Protocol
// ============================================================

const GHOST_MULTIPLIERS: Record<string, number> = {
  food_delivery: 1.2, // platform infra + delivery vehicle
  ride_hailing: 0.9, // server carbon + dispatch infrastructure
  streaming: 0.4, // per hour of data center usage (Netflix avg)
  cloud_storage: 0.15, // per GB per month
  social_media: 0.3, // per hour of server time
  e_commerce: 1.8, // warehouse + last-mile delivery carbon
  fintech: 0.2, // transaction processing + data centers
  gaming: 0.5, // per hour server-side + device power
};

// Human-readable source explanations per category
const SOURCE_EXPLANATIONS: Record<string, string[]> = {
  food_delivery: [
    'Platform server infrastructure',
    'Last-mile delivery vehicle',
    'Cold-chain refrigeration',
  ],
  ride_hailing: [
    'Matching algorithm server load',
    'GPS tracking infrastructure',
    'Idle vehicle emissions',
  ],
  streaming: [
    'Content delivery network (CDN) energy',
    'Data center cooling systems',
    'Transcoding server load',
  ],
  cloud_storage: [
    'Data center energy consumption',
    'Redundant backup systems',
    'Network transmission',
  ],
  social_media: [
    'Feed algorithm compute',
    'Media content storage',
    'Advertising inference servers',
  ],
  e_commerce: [
    'Warehouse automation energy',
    'Last-mile delivery vehicle',
    'Packaging material lifecycle',
    'Returns processing',
  ],
  fintech: [
    'Payment processing servers',
    'Fraud detection ML inference',
    'Transaction ledger storage',
  ],
  gaming: [
    'Game server compute',
    'Anti-cheat system overhead',
    'Streaming infrastructure (cloud gaming)',
  ],
};

/**
 * Infer ghost carbon from a spending category and amount
 *
 * @param category     - Spending category key (e.g. 'food_delivery')
 * @param amountINR    - Amount spent in Indian Rupees
 * @param durationHours - Optional: hours of usage (for streaming, gaming, social media)
 */
export function inferGhostCarbon(
  category: string,
  amountINR: number,
  durationHours?: number
): GhostEstimate {
  const normalizedCategory = category.toLowerCase().replace(/[\s-]/g, '_');
  const multiplier = GHOST_MULTIPLIERS[normalizedCategory];

  if (multiplier === undefined) {
    // Unknown category — use a conservative generic estimate
    return {
      estimatedKg: (amountINR / 1000) * 0.5,
      sources: ['Unknown digital infrastructure'],
      confidence: 0.3,
      explanation: `Estimated ghost carbon for unknown category "${category}". Using conservative average.`,
    };
  }

  // For time-based categories, prefer duration if provided
  let estimatedKg: number;
  if (durationHours !== undefined && ['streaming', 'gaming', 'social_media'].includes(normalizedCategory)) {
    estimatedKg = multiplier * durationHours;
  } else {
    // Amount-based calculation (per ₹1000)
    estimatedKg = multiplier * (amountINR / 1000);
  }

  const sources = SOURCE_EXPLANATIONS[normalizedCategory] ?? ['Digital infrastructure'];

  // Ghost carbon is inherently less certain — confidence scales with known category
  const confidence = multiplier !== undefined ? 0.65 : 0.3;

  const explanation = buildExplanation(normalizedCategory, estimatedKg, amountINR, durationHours);

  return {
    estimatedKg: Math.round(estimatedKg * 1000) / 1000,
    sources,
    confidence,
    explanation,
  };
}

function buildExplanation(
  category: string,
  kg: number,
  amountINR: number,
  durationHours?: number
): string {
  const kgStr = kg.toFixed(3);
  const categoryLabel = category.replace(/_/g, ' ');

  if (durationHours !== undefined) {
    return `${durationHours}h of ${categoryLabel} generated approximately ${kgStr} kg CO2e through hidden server infrastructure and network energy — the "ghost" emissions you never see on your bill.`;
  }

  return `₹${amountINR.toLocaleString('en-IN')} spent on ${categoryLabel} generated approximately ${kgStr} kg CO2e through hidden supply chain, server infrastructure, and last-mile logistics — emissions invisible to standard carbon trackers.`;
}

/**
 * Batch infer ghost carbon from multiple categories
 */
export function inferGhostCarbonBatch(
  items: Array<{ category: string; amountINR: number; durationHours?: number }>
): { total: number; items: GhostEstimate[] } {
  const estimates = items.map((item) =>
    inferGhostCarbon(item.category, item.amountINR, item.durationHours)
  );

  const total = estimates.reduce((sum, e) => sum + e.estimatedKg, 0);

  return {
    total: Math.round(total * 1000) / 1000,
    items: estimates,
  };
}
