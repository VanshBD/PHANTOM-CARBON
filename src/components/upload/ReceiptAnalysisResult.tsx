'use client';

import type { CarbonExtraction, ReceiptItem } from '@/types';

interface ReceiptAnalysisResultProps {
  extraction: CarbonExtraction;
  items: ReceiptItem[];
  logId: string;
  onSave?: () => void;
  onReset: () => void;
}

export function ReceiptAnalysisResult({
  extraction,
  items,
  onSave,
  onReset,
}: ReceiptAnalysisResultProps) {
  const confidenceLabel =
    extraction.confidence > 0.7
      ? 'High'
      : extraction.confidence > 0.4
      ? 'Medium'
      : 'Low';

  const confidenceColor =
    extraction.confidence > 0.7
      ? 'text-green-400 bg-green-900/30 border-green-700/50'
      : extraction.confidence > 0.4
      ? 'text-amber-400 bg-amber-900/30 border-amber-700/50'
      : 'text-red-400 bg-red-900/30 border-red-700/50';

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-fade-in"
      role="region"
      aria-label="Receipt analysis results"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Analysis Complete</h3>
        <span
          className={`text-xs font-semibold border rounded-full px-3 py-1 ${confidenceColor}`}
          aria-label={`Confidence level: ${confidenceLabel} — ${Math.round(extraction.confidence * 100)}%`}
        >
          {confidenceLabel} confidence ({Math.round(extraction.confidence * 100)}%)
        </span>
      </div>

      {/* Total */}
      <div className="text-center mb-6 py-4 bg-gray-800/50 rounded-xl">
        <p className="text-sm text-gray-500 mb-1">Total Carbon Footprint</p>
        <p className="text-4xl font-bold text-white">
          {extraction.totalCarbon.toFixed(3)}
          <span className="text-xl text-gray-500 ml-2">kg CO₂e</span>
        </p>
      </div>

      {/* Layer breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6" role="list" aria-label="Carbon by layer">
        {[
          { label: 'Surface', value: extraction.surfaceCarbon, color: '#22c55e' },
          { label: 'Shadow', value: extraction.shadowCarbon, color: '#f59e0b' },
          { label: 'Ghost', value: extraction.ghostCarbon, color: '#f97316' },
        ].map((layer) => (
          <div
            key={layer.label}
            className="text-center bg-gray-800 rounded-xl p-3"
            role="listitem"
            aria-label={`${layer.label}: ${layer.value.toFixed(3)} kg CO2e`}
          >
            <div className="text-lg font-bold" style={{ color: layer.color }}>
              {layer.value.toFixed(3)}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">kg {layer.label}</div>
          </div>
        ))}
      </div>

      {/* Detected items */}
      {items.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
            Detected Items ({items.length})
          </h4>
          <ul className="space-y-2" aria-label="Receipt items">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2.5 text-sm"
              >
                <div>
                  <span className="text-white font-medium">{item.name}</span>
                  <span className="text-gray-600 ml-2 text-xs">×{item.quantity}</span>
                </div>
                <div className="text-right">
                  <div className="text-gray-400">₹{item.price.toFixed(0)}</div>
                  <div className="text-xs text-gray-600">{item.category}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top action */}
      {extraction.topAction && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-800/50 rounded-xl">
          <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">
            Recommended Action
          </p>
          <p className="text-sm text-gray-300">{extraction.topAction}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onSave && (
          <button
            onClick={onSave}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            aria-label="Save this analysis to your carbon log"
          >
            Save to carbon log
          </button>
        )}
        <button
          onClick={onReset}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-gray-500"
          aria-label="Upload another receipt"
        >
          Upload another
        </button>
      </div>
    </div>
  );
}
