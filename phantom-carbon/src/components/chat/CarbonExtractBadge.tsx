import type { CarbonExtraction } from '@/types';

interface CarbonExtractBadgeProps {
  extraction: CarbonExtraction;
}

function getBadgeColor(totalKg: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (totalKg < 2)
    return { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-700/50', label: 'Low' };
  if (totalKg < 5)
    return { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50', label: 'Medium' };
  return { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700/50', label: 'High' };
}

export function CarbonExtractBadge({ extraction }: CarbonExtractBadgeProps) {
  const { totalCarbon, surfaceCarbon, shadowCarbon, ghostCarbon, confidence } = extraction;
  const colors = getBadgeColor(totalCarbon);

  return (
    <div
      className={`mt-3 ${colors.bg} border ${colors.border} rounded-xl p-4`}
      role="region"
      aria-label={`Carbon extraction result: ${totalCarbon.toFixed(2)} kg CO2e total`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm" aria-hidden="true">⚡</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Carbon Extracted
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 ${colors.bg} border ${colors.border} rounded-full px-2.5 py-1`}
          aria-label={`Impact level: ${colors.label}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text', 'bg')}`} aria-hidden="true" />
          <span className={`text-xs font-bold ${colors.text}`}>{colors.label} impact</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-end gap-1 mb-3">
        <span className={`text-2xl font-bold ${colors.text}`}>{totalCarbon.toFixed(3)}</span>
        <span className="text-gray-500 text-sm mb-0.5">kg CO₂e</span>
      </div>

      {/* Three-layer breakdown */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Surface', value: surfaceCarbon, color: 'text-green-400' },
          { label: 'Shadow', value: shadowCarbon, color: 'text-amber-400' },
          { label: 'Ghost', value: ghostCarbon, color: 'text-orange-400' },
        ].map((layer) => (
          <div key={layer.label} className="text-center bg-gray-900/50 rounded-lg py-2 px-1">
            <div className={`text-sm font-bold ${layer.color}`}>{layer.value.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-0.5">{layer.label}</div>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Confidence</span>
        <span className="font-medium">{Math.round(confidence * 100)}%</span>
      </div>
      <div
        className="mt-1 h-1 bg-gray-800 rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(confidence * 100)}
        aria-label={`Analysis confidence: ${Math.round(confidence * 100)}%`}
      >
        <div
          className="h-full bg-green-600 rounded-full"
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
    </div>
  );
}
