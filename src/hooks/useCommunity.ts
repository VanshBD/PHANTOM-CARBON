'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardData {
  entries: LeaderboardEntry[];
  updatedAt: string;
}

export function useCommunity() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/community/leaderboard');
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to load leaderboard');
      }
      const json = await res.json();
      setData(json.data as LeaderboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { data, isLoading, error, refetch: fetchLeaderboard };
}
