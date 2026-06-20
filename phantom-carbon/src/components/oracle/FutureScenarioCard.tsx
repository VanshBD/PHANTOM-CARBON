'use client';

import { useState } from 'react';

interface FutureScenarioCardProps {
  type: 'dark' | 'possible' | 'phantom';
  narrative: string;
  keyAction: string;
}

const SCENARIO_CONFIG = {
  dark: {
    label: 'Dark Future',
    subtitle: 'If current habits continue',
    icon: '🌑',
    headerBg: 'bg-red-900/40',
    headerBorder: 'border-red-700',
    headerText: 'text-red-300',
    cardBorder: 'border-red-900/50',
    actionColor: 'text-red-400',
  },
  possible: {
    label: 'Possible Future',
    subtitle: 'If moderate changes are made',
    icon: '🌤️',
    headerBg: 'bg-amber-900/40',
    headerBorder: 'border-amber-700',
    headerText: 'text-amber-300',
    cardBorder: 'border-amber-900/50',
    actionColor: 'text-amber-400',
  },
  phantom: {
    label: 'Phantom Future',
    subtitle: 'If ghost carbon is also addressed',
    icon: '🌱',
    headerBg: 'bg-green-900/40',
    headerBorder: 'border-green-700',
    headerText: 'text-green-300',
    cardBorder: 'border-green-900/50',
    actionColor: 'text-green-400',
  },
};

export function FutureScenarioCard({ type, narrative, keyAction }: FutureScenarioCardProps) {
  const [copied, setCopied] = useState(false);
  const config = SCENARIO_CONFIG[type];

  async function copyToClipboard() {
    const text = `${config.label} (2050)\n\n${narrative}\n\nKey action: ${keyAction}\n\n— Phantom Carbon Oracle`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <article
      className={`bg-gray-900 border ${config.cardBorder} rounded-2xl overflow-hidden`}
      aria-label={`${config.label} — ${config.subtitle}`}
    >
      {/* Colored header */}
      <div className={`${config.headerBg} border-b ${config.headerBorder} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{config.icon}</span>
            <div>
              <h3 className={`font-bold text-lg ${config.headerText}`}>{config.label}</h3>
              <p className="text-xs text-gray-500">{config.subtitle}</p>
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            aria-label={`Copy ${config.label} scenario to clipboard`}
            className="text-xs text-gray-600 hover:text-gray-400 border border-gray-700 hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-green-500"
          >
            {copied ? '✓ Copied' : '⎘ Share'}
          </button>
        </div>
      </div>

      {/* Narrative */}
      <div className="px-6 py-5">
        <p className="text-gray-300 leading-relaxed text-sm">{narrative}</p>

        {/* Key action */}
        <div className="mt-5 pt-4 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            The decision that leads here
          </p>
          <p className={`text-sm font-medium ${config.actionColor}`}>{keyAction}</p>
        </div>
      </div>
    </article>
  );
}
