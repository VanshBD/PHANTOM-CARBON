'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { FutureScenarioCard } from '@/components/oracle/FutureScenarioCard';
import { ScenarioTimeline } from '@/components/oracle/ScenarioTimeline';
import type { OracleScenario } from '@/types';

interface OracleResult {
  scenarios: OracleScenario;
  cached: boolean;
}

export default function OraclePage() {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<OracleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tooFewLogs, setTooFewLogs] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim() || !country.trim()) return;

    setIsGenerating(true);
    setError(null);
    setTooFewLogs(false);
    setResult(null);

    try {
      const res = await fetch('/api/oracle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), country: country.trim() }),
      });

      const json = await res.json();

      if (res.status === 422) {
        setTooFewLogs(true);
        return;
      }

      if (!res.ok) {
        setError(json.error ?? 'Failed to generate scenarios.');
        return;
      }

      setResult({ scenarios: json.data as OracleScenario, cached: json.cached });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <main id="main-content" className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="text-5xl mb-4" aria-hidden="true">🔮</div>
            <h1 className="text-3xl font-bold text-white mb-2">The Carbon Oracle</h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Based on your carbon habits, AI generates three vivid 2050 futures for your city.
              Choose which one you want.
            </p>
          </div>

          {/* Too few logs */}
          {tooFewLogs && (
            <div
              role="alert"
              className="mb-8 bg-amber-900/20 border border-amber-700/50 rounded-2xl p-6 text-center"
            >
              <p className="text-2xl mb-3" aria-hidden="true">📊</p>
              <h2 className="text-white font-bold mb-2">Need more data</h2>
              <p className="text-amber-400 text-sm mb-4">
                The Oracle requires at least 3 carbon log entries to generate meaningful scenarios.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/chat" className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                  Chat about activities
                </Link>
                <Link href="/upload" className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
                  Upload a receipt
                </Link>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">
              <span aria-hidden="true">⚠️</span> {error}
            </div>
          )}

          {!result ? (
            /* Input form */
            <div className="max-w-md mx-auto">
              <form
                onSubmit={handleGenerate}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
                aria-label="Generate oracle scenarios"
              >
                <h2 className="font-semibold text-white mb-4">Where are you based?</h2>

                <div className="mb-4">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                    City <span className="text-red-400" aria-label="required">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    required
                    aria-required="true"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus-visible:ring-2 focus-visible:ring-green-500 outline-none"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                    Country <span className="text-red-400" aria-label="required">*</span>
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    required
                    aria-required="true"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus-visible:ring-2 focus-visible:ring-green-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || !city.trim() || !country.trim()}
                  aria-busy={isGenerating}
                  className="w-full bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      Consulting the Oracle…
                    </span>
                  ) : (
                    '🔮 Generate my 2050 futures'
                  )}
                </button>

                <p className="text-xs text-gray-700 text-center mt-3">
                  Results are cached for 7 days · Requires 3+ carbon log entries
                </p>
              </form>
            </div>
          ) : (
            /* Results */
            <div className="space-y-6">
              {result.cached && (
                <div
                  className="bg-blue-900/20 border border-blue-700/50 rounded-xl px-4 py-3 text-sm text-blue-400 text-center"
                  role="status"
                  aria-live="polite"
                >
                  📋 Showing your oracle from this week — refreshes next Monday
                </div>
              )}

              {/* Timeline */}
              <ScenarioTimeline
                weeklyCarbon={result.scenarios.weeklyCarbon}
                trend="stable"
              />

              {/* Three scenarios */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white text-center">Your Three Futures</h2>
                <FutureScenarioCard
                  type="dark"
                  narrative={result.scenarios.darkFuture}
                  keyAction="Continue current habits without change"
                />
                <FutureScenarioCard
                  type="possible"
                  narrative={result.scenarios.possibleFuture}
                  keyAction="Reduce surface and shadow carbon by 30%"
                />
                <FutureScenarioCard
                  type="phantom"
                  narrative={result.scenarios.phantomFuture}
                  keyAction="Address ghost carbon: digital, logistics, and supply chain"
                />
              </div>

              <div className="text-center">
                <button
                  onClick={() => setResult(null)}
                  className="text-sm text-gray-500 hover:text-gray-300 underline"
                >
                  Change city / regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
