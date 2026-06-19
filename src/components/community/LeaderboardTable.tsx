import type { LeaderboardEntry } from '@/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  updatedAt: string;
  onRefresh?: () => void;
}

const LAYER_BADGES = {
  surface: { label: 'Surface', color: 'text-green-400 bg-green-900/30 border-green-700/50' },
  shadow: { label: 'Shadow', color: 'text-amber-400 bg-amber-900/30 border-amber-700/50' },
  ghost: { label: 'Ghost', color: 'text-orange-400 bg-orange-900/30 border-orange-700/50' },
};

function getMedalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

function formatMinutesAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin === 1) return '1 minute ago';
  return `${diffMin} minutes ago`;
}

export function LeaderboardTable({ entries, updatedAt, onRefresh }: LeaderboardTableProps) {
  const timeAgo = formatMinutesAgo(updatedAt);

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
      role="region"
      aria-label="Weekly carbon leaderboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h2 className="font-bold text-white">Weekly Leaderboard</h2>
          <p className="text-xs text-gray-600 mt-0.5" aria-live="polite">
            Updated {timeAgo}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-600 rounded-lg px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-green-500"
            aria-label="Refresh leaderboard"
          >
            ↻ Refresh
          </button>
        )}
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div className="py-16 text-center text-gray-600">
          <p className="text-3xl mb-2" aria-hidden="true">📊</p>
          <p>No data yet this week.</p>
        </div>
      ) : (
        <table className="w-full" aria-label="Carbon leaderboard with anonymized user rankings">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-xs font-medium text-gray-600 px-6 py-3 uppercase tracking-wide" scope="col">
                Rank
              </th>
              <th className="text-left text-xs font-medium text-gray-600 px-4 py-3 uppercase tracking-wide" scope="col">
                User
              </th>
              <th className="text-right text-xs font-medium text-gray-600 px-4 py-3 uppercase tracking-wide" scope="col">
                Weekly CO₂e
              </th>
              <th className="text-right text-xs font-medium text-gray-600 px-4 py-3 uppercase tracking-wide hidden sm:table-cell" scope="col">
                Reduction
              </th>
              <th className="text-right text-xs font-medium text-gray-600 px-6 py-3 uppercase tracking-wide hidden md:table-cell" scope="col">
                Top Layer
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const layerBadge = LAYER_BADGES[entry.topLayer];
              const medal = getMedalEmoji(entry.rank);

              return (
                <tr
                  key={entry.anonymousId}
                  className={`
                    border-b border-gray-800/50 transition-colors
                    ${entry.isCurrentUser
                      ? 'bg-green-900/10 border-green-900/30'
                      : 'hover:bg-gray-800/30'
                    }
                  `}
                  aria-label={`Rank ${entry.rank}: ${entry.anonymousId}${entry.isCurrentUser ? ' (you)' : ''} — ${entry.weeklyTotal} kg CO2e this week`}
                  aria-current={entry.isCurrentUser ? 'true' : undefined}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-sm w-6 text-right">
                        {entry.rank}
                      </span>
                      {medal && <span aria-hidden="true">{medal}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-300">{entry.anonymousId}</span>
                      {entry.isCurrentUser && (
                        <span
                          className="text-xs bg-green-900/50 text-green-400 border border-green-700/50 rounded-full px-2 py-0.5"
                          aria-label="This is you"
                        >
                          you
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-white">{entry.weeklyTotal.toFixed(2)}</span>
                    <span className="text-gray-600 text-xs ml-1">kg</span>
                  </td>
                  <td className="px-4 py-4 text-right hidden sm:table-cell">
                    {entry.reductionPercent !== 0 ? (
                      <span
                        className={entry.reductionPercent > 0 ? 'text-green-400' : 'text-red-400'}
                        aria-label={`${Math.abs(entry.reductionPercent)}% ${entry.reductionPercent > 0 ? 'reduction' : 'increase'}`}
                      >
                        {entry.reductionPercent > 0 ? '↓' : '↑'}
                        {Math.abs(entry.reductionPercent)}%
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right hidden md:table-cell">
                    <span
                      className={`text-xs font-medium border rounded-full px-2 py-0.5 ${layerBadge.color}`}
                    >
                      {layerBadge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
