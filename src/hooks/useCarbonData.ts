'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CarbonSummary } from '@/types';

type Period = '7d' | '30d' | '90d';

export function useCarbonData(period: Period = '7d') {
  const [data, setData] = useState<CarbonSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/carbon/summary?period=${period}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Failed to load carbon data');
      }
      const json = await res.json();
      setData(json.data as CarbonSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
