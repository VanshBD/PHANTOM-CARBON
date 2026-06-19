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

  const category = getCarbonCategory(todayTotal || dailyAvg);
  const config = CATEGORY_CONFIG[category];

  const trendLabel =
    summary.trend === 'improving'
      ? '↓ Improving'
      : summary.trend === 'worsening'
      ? '↑ Worsening'
      : '→ Stable';

  const trendColor =
    summary.trend === 'improving'
      ? 'text-green-400'
      : summary.trend === 'worsening'
      ? 'text-red-400'
      : 'text-gray-500';

  return (
    <div
      className={`${config.bgColor} border rounded-xl p-6`}
      role="region"
      aria-label={`Daily carbon score: ${todayTotal.toFixed(2)} kg CO2e — ${config.label}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-gray-400 mb-1">Today&apos;s Carbon Score</h2>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${config.color}`}>
              {(todayTotal || dailyAvg).toFixed(2)}
            </span>
            <span className="text-gray-500 mb-1">kg CO₂e</span>
          </div>
        </div>
        <div
          className={`${config.bgColor} border rounded-lg px-3 py-2 text-center`}
          role="status"
          aria-label={`Category: ${config.label}`}
        >
          <div className="text-2xl" aria-hidden="true">{config.icon}</div>
          <div className={`text-xs font-bold mt-1 ${config.color}`}>{config.label}</div>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">7-day trend</span>
        <span className={`font-medium ${trendColor}`} aria-live="polite">
          {trendLabel}
        </span>
      </div>

      {/* Weekly total */}
      <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between text-sm">
        <span className="text-gray-500">Period total</span>
        <span className="font-semibold text-white">
          {summary.totalCarbon.toFixed(2)} kg CO₂e
        </span>
      </div>

      {/* Top action */}
      {summary.topAction && (
        <div className="mt-3 pt-3 border-t border-gray-800/50">
          <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Top action</p>
          <p className="text-sm text-gray-300 leading-relaxed">{summary.topAction}</p>
        </div>
      )}
    </div>
  );
}
