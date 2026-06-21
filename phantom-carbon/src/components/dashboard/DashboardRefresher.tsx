'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState } from 'react';

interface DashboardRefresherProps {
  /** Auto-refresh interval in seconds. Default: 30 */
  intervalSeconds?: number;
}

/**
 * Invisible client component that auto-refreshes the dashboard.
 * Calls router.refresh() which re-runs server components without a full page reload.
 * Also refreshes when the browser tab becomes visible again.
 */
export function DashboardRefresher({ intervalSeconds = 30 }: DashboardRefresherProps) {
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setLastRefreshed(new Date());
    setTimeout(() => setIsRefreshing(false), 800);
  }, [router]);

  // Auto-refresh on interval
  useEffect(() => {
    const interval = setInterval(refresh, intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [refresh, intervalSeconds]);

  // Refresh when user returns to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const secsAgo = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
  const label   = secsAgo < 5 ? 'just now' : `${secsAgo}s ago`;

  return (
    <button
      onClick={refresh}
      disabled={isRefreshing}
      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors focus-visible:ring-2 focus-visible:ring-green-500 rounded px-2 py-1 disabled:cursor-default"
      aria-label="Refresh dashboard data"
      title={`Last updated ${label}`}
    >
      <svg
        width="12" height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isRefreshing ? 'animate-spin' : ''}
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
      <span aria-live="polite">
        {isRefreshing ? 'Refreshing…' : `Updated ${label}`}
      </span>
    </button>
  );
}
