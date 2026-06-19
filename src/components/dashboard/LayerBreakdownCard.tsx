import type { CarbonLayer } from '@/types';

interface LayerBreakdownCardProps {
  layer: CarbonLayer;
  value: number;
  percentage: number;
  trend?: 'up' | 'down' | 'flat';
}

const LAYER_CONFIG = {
  surface: {
    label: 'Surface Carbon',
    sublabel: 'Direct emissions',
    color: '#22c55e',
    textColor: 'text-green-400',
    bg: 'bg-green-900/10 hover:bg-green-900/20',
    border: 'border-green-800/40 hover:border-green-600/50',
    glow: 'hover:shadow-[0_0_25px_rgba(34,197,94,0.12)]',
    iconBg: 'bg-green-900/40',
    icon: '🌍',
    description: 'Transport · Food · Energy',
  },
  shadow: {
    label: 'Shadow Carbon',
    sublabel: 'Product lifecycle',
    color: '#f59e0b',
    textColor: 'text-amber-400',
    bg: 'bg-amber-900/10 hover:bg-amber-900/20',
    border: 'border-amber-800/40 hover:border-amber-600/50',
    glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.12)]',
    iconBg: 'bg-amber-900/40',
    icon: '👁️',
    description: 'Purchases · Manufacturing',
  },
  ghost: {
    label: 'Ghost Carbon',
    sublabel: 'Hidden supply chain',
    color: '#f97316',
    textColor: 'text-orange-400',
    bg: 'bg-orange-900/10 hover:bg-orange-900/20',
    border: 'border-orange-800/40 hover:border-orange-600/50',
    glow: 'hover:shadow-[0_0_25px_rgba(249,115,22,0.12)]',
    iconBg: 'bg-orange-900/40',
    icon: '👻',
    description: 'Digital · Logistics · Data centers',
  },
};

export function LayerBreakdownCard({ layer, value, percentage, trend }: LayerBreakdownCardProps) {
  const config = LAYER_CONFIG[layer];

  return (
    <div
      className={`${config.bg} border ${config.border} ${config.glow} rounded-xl p-5 transition-all duration-300`}
      role="article"
      aria-label={`${config.label}: ${value.toFixed(2)} kg CO2e, ${percentage.toFixed(0)}% of total`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center text-xl`} aria-hidden="true">
          {config.icon}
        </div>
        {trend && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              trend === 'down' ? 'bg-green-900/30 text-green-400' :
              trend === 'up'   ? 'bg-red-900/30 text-red-400' :
              'bg-gray-800 text-gray-500'
            }`}
            aria-label={`Trend: ${trend === 'down' ? 'improving' : trend === 'up' ? 'worsening' : 'stable'}`}
          >
            {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '→'}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-xs text-gray-500 font-medium mb-1">{config.description}</p>
      <h3 className={`text-sm font-bold ${config.textColor} mb-3`}>{config.label}</h3>

      {/* Big number */}
      <div className="mb-4">
        <span className={`text-3xl font-bold tabular-nums ${config.textColor}`}>
          {value.toFixed(2)}
        </span>
        <span className="text-gray-600 text-xs ml-1">kg CO₂e</span>
      </div>

      {/* Progress bar */}
      <div>
        <div
          className="h-1.5 bg-gray-800 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentage)}
          aria-label={`${percentage.toFixed(0)}% of total footprint`}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: config.color }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1.5 text-right">{percentage.toFixed(0)}% of total</p>
      </div>
    </div>
  );
}
