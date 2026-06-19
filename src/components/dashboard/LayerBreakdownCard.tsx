import type { CarbonLayer } from '@/types';

interface LayerBreakdownCardProps {
  layer: CarbonLayer;
  value: number; // kg CO2e
  percentage: number; // % of total
  trend?: 'up' | 'down' | 'flat';
}

const LAYER_CONFIG = {
  surface: {
    label: 'Surface Carbon',
    sublabel: 'Direct emissions',
    color: '#22c55e',
    bg: 'bg-green-900/20',
    border: 'border-green-800/50',
    badge: 'bg-green-500/10 text-green-400',
    icon: '🌍',
    description: 'Transport, food, energy',
  },
  shadow: {
    label: 'Shadow Carbon',
    sublabel: 'Product lifecycle',
    color: '#f59e0b',
    bg: 'bg-amber-900/20',
    border: 'border-amber-800/50',
    badge: 'bg-amber-500/10 text-amber-400',
    icon: '👁️',
    description: 'Purchases, manufacturing',
  },
  ghost: {
    label: 'Ghost Carbon',
    sublabel: 'Hidden supply chain',
    color: '#f97316',
    bg: 'bg-orange-900/20',
    border: 'border-orange-800/50',
    badge: 'bg-orange-500/10 text-orange-400',
    icon: '👻',
    description: 'Digital, logistics, data centers',
  },
};

export function LayerBreakdownCard({ layer, value, percentage, trend }: LayerBreakdownCardProps) {
  const config = LAYER_CONFIG[layer];

  return (
    <div
      className={`${config.bg} border ${config.border} rounded-xl p-5`}
      role="article"
      aria-label={`${config.label}: ${value.toFixed(2)} kg CO2e, ${percentage.toFixed(0)}% of total`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-white text-sm">{config.label}</h3>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        </div>
        {trend && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              trend === 'down'
                ? 'bg-green-900/30 text-green-400'
                : trend === 'up'
                ? 'bg-red-900/30 text-red-400'
                : 'bg-gray-800 text-gray-500'
            }`}
            aria-label={`Trend: ${trend === 'down' ? 'decreasing' : trend === 'up' ? 'increasing' : 'stable'}`}
          >
            {trend === 'down' ? '↓ improving' : trend === 'up' ? '↑ worsening' : '→ stable'}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="text-2xl font-bold" style={{ color: config.color }}>
          {value.toFixed(2)}
        </span>
        <span className="text-gray-500 text-sm ml-1">kg CO₂e</span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 bg-gray-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
        aria-label={`${percentage.toFixed(0)}% of total footprint`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: config.color,
          }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-1.5">{percentage.toFixed(0)}% of total</p>
    </div>
  );
}
