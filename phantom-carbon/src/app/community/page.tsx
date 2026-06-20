'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { LeaderboardTable } from '@/components/community/LeaderboardTable';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardData {
  entries: LeaderboardEntry[];
  updatedAt: string;
}

export default function CommunityPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchLeaderboard() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/community/leaderboard');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to load leaderboard');
        return;
      }
      setData(json.data as LeaderboardData);
    } catch {
      setError('Unable to load leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <main id="main-content" className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Community Impact</h1>
            <p className="text-gray-500 mt-1">
              Anonymized weekly rankings — privacy-first, collective accountability
            </p>
          </div>

          {/* Privacy notice */}
          <div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <details>
              <summary className="text-sm font-medium text-gray-400 cursor-pointer hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-green-500 rounded">
                🔒 How is anonymity protected?
              </summary>
              <div className="mt-3 text-sm text-gray-500 space-y-2 pl-4">
                <p>
                  Your real user ID and email are never visible on the leaderboard. We generate
                  a display name (like &ldquo;EcoHero#4821&rdquo;) using a one-way SHA-256 hash of
                  your internal ID combined with a server-side salt.
                </p>
                <p>
                  This means the same user always gets the same display name, but it&apos;s
                  mathematically impossible to reverse the hash back to your real identity.
                </p>
                <p>Only your weekly carbon total and dominant layer are shared — no other data.</p>
              </div>
            </details>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">
              <span aria-hidden="true">⚠️</span> {error}
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center"
              aria-live="polite"
              aria-label="Loading leaderboard"
            >
              <div className="flex items-center justify-center gap-3 text-gray-500">
                <span className="w-5 h-5 border-2 border-gray-600 border-t-green-500 rounded-full animate-spin" aria-hidden="true" />
                Loading leaderboard…
              </div>
            </div>
          ) : data ? (
            <LeaderboardTable
              entries={data.entries}
              updatedAt={data.updatedAt}
              onRefresh={fetchLeaderboard}
            />
          ) : null}

          {/* Footer info */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: '📊', title: 'Top 20 shown', desc: 'By lowest weekly carbon' },
              { icon: '🔄', title: 'Updated every 10 min', desc: 'Cached for performance' },
              { icon: '🏆', title: 'Your rank included', desc: 'Even if outside top 20' },
            ].map((info) => (
              <div key={info.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                <div className="text-xl mb-1" aria-hidden="true">{info.icon}</div>
                <div className="text-sm font-medium text-white">{info.title}</div>
                <div className="text-xs text-gray-600 mt-0.5">{info.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
