import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimiters } from '@/lib/rate-limit';
import { oracleGenerateSchema } from '@/lib/validators';
import { prisma } from '@/lib/prisma';
import { generateScenarios, getOracleCacheKey } from '@/services/oracleService';
import { redisGet } from '@/lib/redis';
import type { CarbonSummary, CarbonBreakdown } from '@/types';

const MIN_LOGS_REQUIRED = 3;

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id;

  // Rate limit (2/hour)
  const rateLimitResult = await rateLimiters.oracleGenerate(userId);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Oracle rate limit exceeded. You can generate up to 2 reports per hour.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimitResult.retryAfter ?? 3600) },
      }
    );
  }

  // Validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = oracleGenerateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { city, country } = validation.data;

  // Check Redis cache first (oracle already generated this week)
  const cacheKey = getOracleCacheKey(userId);
  const cached = await redisGet(cacheKey);
  if (cached) {
    return NextResponse.json({
      data: JSON.parse(cached),
      message: 'Oracle report retrieved from this week\'s cache',
      cached: true,
    });
  }

  // Check minimum data requirement
  const logCount = await prisma.carbonLog.count({ where: { userId } });
  if (logCount < MIN_LOGS_REQUIRED) {
    return NextResponse.json(
      {
        error: `Oracle requires at least ${MIN_LOGS_REQUIRED} carbon log entries. You currently have ${logCount}.`,
        logsRequired: MIN_LOGS_REQUIRED,
        logsPresent: logCount,
      },
      { status: 422 }
    );
  }

  // Get 7-day carbon summary
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const logs = await prisma.carbonLog.findMany({
    where: { userId, createdAt: { gte: since } },
    select: {
      surfaceCarbon: true,
      shadowCarbon: true,
      ghostCarbon: true,
      totalCarbon: true,
      breakdown: true,
    },
  });

  // Fallback: use all logs if none in last 7 days
  const sourceLogs =
    logs.length > 0
      ? logs
      : await prisma.carbonLog.findMany({
          where: { userId },
          select: {
            surfaceCarbon: true,
            shadowCarbon: true,
            ghostCarbon: true,
            totalCarbon: true,
            breakdown: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

  const totals = sourceLogs.reduce(
    (acc, log) => ({
      surface: acc.surface + log.surfaceCarbon,
      shadow: acc.shadow + log.shadowCarbon,
      ghost: acc.ghost + log.ghostCarbon,
      total: acc.total + log.totalCarbon,
    }),
    { surface: 0, shadow: 0, ghost: 0, total: 0 }
  );

  const categoryBreakdown: CarbonBreakdown = {};
  for (const log of sourceLogs) {
    const bd = log.breakdown as CarbonBreakdown;
    if (!bd) continue;
    if (bd.transport) categoryBreakdown.transport = (categoryBreakdown.transport ?? 0) + bd.transport;
    if (bd.food) categoryBreakdown.food = (categoryBreakdown.food ?? 0) + bd.food;
    if (bd.energy) categoryBreakdown.energy = (categoryBreakdown.energy ?? 0) + bd.energy;
    if (bd.shopping) categoryBreakdown.shopping = (categoryBreakdown.shopping ?? 0) + bd.shopping;
    if (bd.digital) categoryBreakdown.digital = (categoryBreakdown.digital ?? 0) + bd.digital;
    if (bd.supplyChain) categoryBreakdown.supplyChain = (categoryBreakdown.supplyChain ?? 0) + bd.supplyChain;
  }

  const summary: CarbonSummary = {
    period: '7d',
    totalSurface: totals.surface,
    totalShadow: totals.shadow,
    totalGhost: totals.ghost,
    totalCarbon: totals.total,
    dailyBreakdown: [],
    trend: 'stable',
    categoryBreakdown,
  };

  try {
    const scenarios = await generateScenarios(userId, summary, city, country);

    // Save oracle report to DB
    await prisma.oracleReport.create({
      data: {
        userId,
        darkFuture: scenarios.darkFuture,
        possibleFuture: scenarios.possibleFuture,
        phantomFuture: scenarios.phantomFuture,
        weeklyCarbon: scenarios.weeklyCarbon,
      },
    });

    return NextResponse.json({
      data: scenarios,
      message: 'Oracle scenarios generated successfully',
      cached: false,
    });
  } catch (err) {
    console.error('[API/oracle/generate] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate oracle scenarios. Please try again.' },
      { status: 500 }
    );
  }
}
