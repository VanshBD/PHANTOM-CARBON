import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { carbonSummarySchema } from '@/lib/validators';
import { prisma } from '@/lib/prisma';
import { redisGet, redisSet } from '@/lib/redis';
import type { CarbonSummary, DailyCarbon, CarbonBreakdown } from '@/types';

const CACHE_TTL = 300; // 5 minutes

function getPeriodDays(period: string): number {
  switch (period) {
    case '7d':  return 7;
    case '30d': return 30;
    case '90d': return 90;
    default:    return 7;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const queryValidation = carbonSummarySchema.safeParse({
    period: searchParams.get('period') ?? '7d',
  });

  if (!queryValidation.success) {
    return NextResponse.json({ error: 'Invalid period parameter' }, { status: 400 });
  }

  const { period } = queryValidation.data;
  const cacheKey = `summary:${userId}:${period}`;

  // Check Redis cache
  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      return NextResponse.json({ data: JSON.parse(cached) });
    }
  } catch {
    // Redis unavailable — continue without cache
  }

  const days  = getPeriodDays(period);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.carbonLog.findMany({
    where: { userId, createdAt: { gte: since } },
    select: {
      surfaceCarbon: true,
      shadowCarbon:  true,
      ghostCarbon:   true,
      totalCarbon:   true,
      breakdown:     true,
      createdAt:     true,
      rawAiResponse: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (logs.length === 0) {
    const empty: CarbonSummary = {
      period,
      totalSurface: 0,
      totalShadow:  0,
      totalGhost:   0,
      totalCarbon:  0,
      dailyBreakdown: [],
      trend: 'stable',
      categoryBreakdown: {},
    };
    return NextResponse.json({ data: empty });
  }

  const totals = logs.reduce(
    (acc, log) => ({
      surface: acc.surface + log.surfaceCarbon,
      shadow:  acc.shadow  + log.shadowCarbon,
      ghost:   acc.ghost   + log.ghostCarbon,
      total:   acc.total   + log.totalCarbon,
    }),
    { surface: 0, shadow: 0, ghost: 0, total: 0 }
  );

  const categoryBreakdown: CarbonBreakdown = {};
  for (const log of logs) {
    const bd = log.breakdown as CarbonBreakdown | null;
    if (!bd) continue;
    if (bd.transport)   categoryBreakdown.transport   = (categoryBreakdown.transport   ?? 0) + bd.transport;
    if (bd.food)        categoryBreakdown.food        = (categoryBreakdown.food        ?? 0) + bd.food;
    if (bd.energy)      categoryBreakdown.energy      = (categoryBreakdown.energy      ?? 0) + bd.energy;
    if (bd.shopping)    categoryBreakdown.shopping    = (categoryBreakdown.shopping    ?? 0) + bd.shopping;
    if (bd.digital)     categoryBreakdown.digital     = (categoryBreakdown.digital     ?? 0) + bd.digital;
    if (bd.supplyChain) categoryBreakdown.supplyChain = (categoryBreakdown.supplyChain ?? 0) + bd.supplyChain;
  }

  const dailyMap = new Map<string, DailyCarbon>();
  for (const log of logs) {
    const dateKey = log.createdAt.toISOString().split('T')[0];
    const existing = dailyMap.get(dateKey) ?? { date: dateKey, surface: 0, shadow: 0, ghost: 0, total: 0 };
    dailyMap.set(dateKey, {
      ...existing,
      surface: existing.surface + log.surfaceCarbon,
      shadow:  existing.shadow  + log.shadowCarbon,
      ghost:   existing.ghost   + log.ghostCarbon,
      total:   existing.total   + log.totalCarbon,
    });
  }
  const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  let trend: 'improving' | 'worsening' | 'stable' = 'stable';
  if (dailyBreakdown.length >= 4) {
    const mid       = Math.floor(dailyBreakdown.length / 2);
    const firstAvg  = dailyBreakdown.slice(0, mid).reduce((s, d) => s + d.total, 0) / mid;
    const secondAvg = dailyBreakdown.slice(mid).reduce((s, d) => s + d.total, 0) / (dailyBreakdown.length - mid);
    if (secondAvg < firstAvg * 0.95)      trend = 'improving';
    else if (secondAvg > firstAvg * 1.05) trend = 'worsening';
  }

  const latestLog = logs[logs.length - 1];
  const rawResponse = latestLog?.rawAiResponse as { topAction?: string } | null;

  const summary: CarbonSummary = {
    period,
    totalSurface:  Math.round(totals.surface * 100) / 100,
    totalShadow:   Math.round(totals.shadow  * 100) / 100,
    totalGhost:    Math.round(totals.ghost   * 100) / 100,
    totalCarbon:   Math.round(totals.total   * 100) / 100,
    dailyBreakdown,
    trend,
    categoryBreakdown,
    topAction: rawResponse?.topAction,
  };

  try {
    await redisSet(cacheKey, JSON.stringify(summary), CACHE_TTL);
  } catch {
    // Redis unavailable — skip caching
  }

  return NextResponse.json({ data: summary });
}
