import { getCarbonCategory, CATEGORY_CONFIG } from '@/services/carbonEngine';
import type { CarbonSummary } from '@/types';

interface DailyScoreCardProps {
  summary: CarbonSummary;
}

export function DailyScoreCard({ summary }: DailyScoreCardProps) {
  const dailyAvg =
    summary.dailyBreakdown.length > 0
      ? summary.totalCarbon / summary.dailyBreakdown.length
      : 0;

  const today = summary.dailyBreakdown[summary.dailyBreakdown.length - 1];
  const todayTotal = today?.total ?? 0;
  const displayValue = todayTotal || dailyAvg;

  const category = getCarbonCategory(displayValue);
  const config = CATEGORY_CONFIG[category];

  const trendLabel =
    summary.trend === 'improving' ? '↓ Improving' :
    summary.trend === 'worsening' ? '↑ Worsening' : '→ Stable';

  const trendColor =
    summary.trend === 'improving' ? 'text-green-400' :
    summary.trend === 'worsening' ? 'text-red-400' : 'text-gray-500';

  // Progress bar fill — 0 kg = empty, 20 kg = full
  const barPercent = Math.min((displayValue / 20) * 100, 100);

  return (
    <div
      className={`${config.bgColor} border rounded-2xl p-6 relative overflow-hidden`}
      role="region"
      aria-label={`Daily carbon score: ${displayValue.toFixed(2)} kg CO2e — ${config.label}`}
    >
      {/* Subtle glow background */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${
            category === 'excellent' ? '#22c55e' :
            category === 'good' ? '#10b981' :
            category === 'average' ? '#f59e0b' :
            category === 'high' ? '#f97316' : '#ef4444'
          } 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
              Today&apos;s Score
            </p>
            <div className="flex items-end gap-2">
              <span className={`text-5xl font-bold tabular-nums ${config.color}`}>
                {displayValue.toFixed(1)}
              </span>
              <span className="text-gray-500 text-sm mb-2">kg CO₂e</span>
            </div>
          </div>
          <div
            className={`${config.bgColor} border rounded-xl p-3 text-center min-w-[64px]`}
            role="status"
            aria-label={`Category: ${config.label}`}
          >
            <div className="text-2xl mb-1" aria-hidden="true">{config.icon}</div>
            <div className={`text-xs font-bold ${config.color}`}>{config.label}</div>
          </div>
        </div>

        {/* Carbon meter bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span>0 kg</span>
            <span>20 kg/day</span>
          </div>
          <div
            className="h-2 bg-gray-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={20}
            aria-valuenow={Math.round(displayValue)}
            aria-label={`Carbon level: ${displayValue.toFixed(1)} of 20 kg daily`}
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                category === 'excellent' ? 'bg-green-500' :
                category === 'good' ? 'bg-emerald-500' :
                category === 'average' ? 'bg-amber-500' :
                category === 'high' ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800/50">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">7-day trend</p>
            <p className={`text-sm font-semibold ${trendColor}`} aria-live="polite">
              {trendLabel}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Period total</p>
            <p className="text-sm font-semibold text-white">
              {summary.totalCarbon.toFixed(1)} kg
            </p>
          </div>
        </div>

        {/* Top action */}
        {summary.topAction && (
          <div className="mt-4 pt-4 border-t border-gray-800/50">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1.5">
              💡 Top action
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">{summary.topAction}</p>
          </div>
        )}
      </div>
    </div>
  );
}
