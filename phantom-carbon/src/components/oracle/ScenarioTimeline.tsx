interface ScenarioTimelineProps {
  weeklyCarbon: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export function ScenarioTimeline({ weeklyCarbon, trend }: ScenarioTimelineProps) {
  const annualKg = weeklyCarbon * 52;
  const indianAvgAnnual = 1900; // kg CO2e per person per year (India avg)
  const globalAvgAnnual = 4800;

  const trendLabel =
    trend === 'improving' ? '↓ Improving' : trend === 'worsening' ? '↑ Worsening' : '→ Stable';
  const trendColor =
    trend === 'improving'
      ? 'text-green-400'
      : trend === 'worsening'
      ? 'text-red-400'
      : 'text-gray-500';

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
      role="region"
      aria-label="Your carbon trajectory"
    >
      <h3 className="font-bold text-white mb-4">Your Current Trajectory</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{weeklyCarbon.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">kg CO₂e / week</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{(annualKg / 1000).toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">tonnes / year</p>
        </div>
        <div className="text-center">
          <p className={`text-xl font-bold ${trendColor}`}>{trendLabel}</p>
          <p className="text-xs text-gray-500 mt-1">7-day trend</p>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>You (annual)</span>
            <span>{annualKg.toFixed(0)} kg</span>
          </div>
          <div
            className="h-2 bg-gray-800 rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={globalAvgAnnual}
            aria-valuenow={annualKg}
          >
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${Math.min((annualKg / globalAvgAnnual) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>India average</span>
            <span>{indianAvgAnnual} kg</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full">
            <div
              className="h-full rounded-full bg-amber-600"
              style={{ width: `${(indianAvgAnnual / globalAvgAnnual) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Global average</span>
            <span>{globalAvgAnnual} kg</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full">
            <div className="h-full rounded-full bg-gray-600 w-full" />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-700 mt-4">
        Sources: CEEW India Climate Tracker 2023, IEA World Energy Outlook 2023
      </p>
    </div>
  );
}
