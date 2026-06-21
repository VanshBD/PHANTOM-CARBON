import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { carbonSummarySchema } from '@/lib/validators';
import { prisma } from '@/lib/prisma';
import { redisGet, redisSet } from '@/lib/redis';
import {
  buildCarbonSummaryFromLogs,
  createEmptyCarbonSummary,
  getPeriodDays,
} from '@/lib/carbonUtils';

const CACHE_TTL = 300; // 5 minutes

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

  const summary = logs.length === 0
    ? createEmptyCarbonSummary(period)
    : buildCarbonSummaryFromLogs(period, logs);

  try {
    await redisSet(cacheKey, JSON.stringify(summary), CACHE_TTL);
  } catch {
    // Redis unavailable — skip caching
  }

  return NextResponse.json({ data: summary });
}
